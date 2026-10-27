import type { BattleEvent } from '../../core/battle/types';
import { displayText } from '../../ui/ruby';
import { LOG_BASE_MS, LOG_CHAR_MS, LOG_MAX_MS } from './layout';
import { narrate, type NarrateCtx } from './narrate';
import { TALK_FIRST } from './sceneModel';

export type BattleTextCommand = {
  kind: 'text';
  text: string;
  mode: 'log' | 'say-auto' | 'say-wait';
};

export type BattleWaitCommand = {
  kind: 'wait';
  ms: number;
  /** Only automatic pacing waits are skippable. */
  skippable: true;
};

export type BattleVisualCommand = {
  kind: 'visual';
  event: BattleEvent;
};

export type BattlePresentationCommand =
  | BattleTextCommand
  | BattleWaitCommand
  | BattleVisualCommand
  | { kind: 'sequence'; commands: BattlePresentationCommand[] }
  | { kind: 'parallel'; commands: BattlePresentationCommand[] }
  | { kind: 'audio'; scope: 'duck'; commands: BattlePresentationCommand[] };

export interface BattlePresentationPort {
  text: {
    log(text: string): void;
    say(text: string, mode: 'wait' | 'auto', signal: AbortSignal): Promise<void>;
  };
  clock: {
    wait(ms: number, signal: AbortSignal): Promise<void>;
  };
  /** Phaser adapter for sprite, tween, and camera effects. It must apply final visual state even when fast. */
  visual: {
    play(command: BattleVisualCommand, context: { signal: AbortSignal; fastForward: boolean }): Promise<void>;
  };
  audio: {
    withDucked(play: () => Promise<void>, signal: AbortSignal): Promise<void>;
  };
  lifecycle: {
    cleanup(reason: BattlePresentationStopReason, error?: unknown): void | Promise<void>;
  };
}

export type BattlePresentationStopReason = 'cancelled' | 'error' | 'shutdown';

export class BattlePresentationCancelledError extends Error {
  constructor(readonly reason: Exclude<BattlePresentationStopReason, 'error'>) {
    super(`Battle presentation ${reason}`);
    this.name = 'BattlePresentationCancelledError';
  }
}

function sequence(commands: BattlePresentationCommand[]): BattlePresentationCommand | null {
  if (commands.length === 0) return null;
  return commands.length === 1 ? commands[0]! : { kind: 'sequence', commands };
}

function textCommands(event: BattleEvent, previous: BattleEvent | undefined, ctx: NarrateCtx) {
  const lines = narrate(event, ctx, previous);
  const commands: BattlePresentationCommand[] = [];
  if (event.t === 'defeat' || event.t === 'bossPhase') {
    for (const line of lines) {
      commands.push({
        kind: 'text',
        text: line,
        mode: event.t === 'defeat' || line.startsWith('「') ? 'say-wait' : 'say-auto',
      });
    }
    return commands;
  }
  for (let i = 0; i < lines.length; i += 2) {
    const text = lines.slice(i, i + 2).join('\n');
    commands.push({ kind: 'text', text, mode: 'log' });
    commands.push({
      kind: 'wait',
      ms: Math.min(LOG_MAX_MS, LOG_BASE_MS + displayText(text).length * LOG_CHAR_MS),
      skippable: true,
    });
  }
  return commands;
}

/** Convert events without reordering them. Legacy item/heal normalization stays at the Scene boundary. */
export function compileBattlePresentation(
  events: readonly BattleEvent[],
  ctx: NarrateCtx,
): BattlePresentationCommand[] {
  return events.map((event, index) => {
    const visual: BattlePresentationCommand = {
      kind: 'visual',
      event,
    };
    const animation: BattlePresentationCommand =
      event.t === 'act' && event.command === 'skill'
        ? { kind: 'audio', scope: 'duck', commands: [visual] }
        : visual;
    const talk = sequence(textCommands(event, events[index - 1], ctx));
    if (!talk) return animation;
    return TALK_FIRST.has(event.t)
      ? { kind: 'parallel', commands: [talk, animation] }
      : { kind: 'sequence', commands: [animation, talk] };
  });
}

interface RuntimeOptions {
  onIdle?(): void;
}

/**
 * Serial BattleEvent presentation queue.
 *
 * Fast-forward and skip affect automatic waits only. Manual text, visual final-state application,
 * audio scopes, and battle logic are never skipped.
 */
export class BattlePresentationRuntime {
  private readonly controller = new AbortController();
  private skipController = new AbortController();
  private tail: Promise<void> = Promise.resolve();
  private cleanupTask: Promise<void> | null = null;
  private closedReason: Exclude<BattlePresentationStopReason, 'error'> | null = null;
  private fastForward = false;
  private activeTasks = 0;

  constructor(
    private readonly port: BattlePresentationPort,
    private readonly options: RuntimeOptions = {},
  ) {}

  get activeTaskCount(): number {
    return this.activeTasks;
  }

  enqueue(events: readonly BattleEvent[], ctx: NarrateCtx): Promise<void> {
    if (this.closedReason || this.controller.signal.aborted)
      return Promise.reject(new BattlePresentationCancelledError(this.closedReason ?? 'cancelled'));

    this.activeTasks++;
    const commands = compileBattlePresentation(events, ctx);
    const task = this.tail
      .then(() => this.runCommands(commands))
      .catch(async (error: unknown) => {
        if (error instanceof BattlePresentationCancelledError) throw error;
        await this.fail(error);
        throw error;
      });
    this.tail = task.catch(() => undefined);

    let settled = false;
    return task.finally(() => {
      if (settled) return;
      settled = true;
      this.activeTasks--;
      if (this.activeTasks === 0 && !this.controller.signal.aborted) this.options.onIdle?.();
    });
  }

  setFastForward(enabled: boolean): void {
    this.fastForward = enabled;
    if (enabled) this.skipSkippable();
  }

  skipSkippable(): void {
    this.skipController.abort();
    this.skipController = new AbortController();
  }

  async cancel(reason: Exclude<BattlePresentationStopReason, 'error'> = 'cancelled'): Promise<void> {
    if (!this.closedReason) this.closedReason = reason;
    if (!this.controller.signal.aborted) this.controller.abort();
    this.skipSkippable();
    await this.cleanup(reason);
  }

  dispose(reason: 'shutdown' = 'shutdown'): Promise<void> {
    return this.cancel(reason);
  }

  private async fail(error: unknown): Promise<void> {
    if (!this.controller.signal.aborted) this.controller.abort();
    this.skipSkippable();
    await this.cleanup('error', error);
  }

  private cleanup(reason: BattlePresentationStopReason, error?: unknown): Promise<void> {
    if (!this.cleanupTask)
      this.cleanupTask = Promise.resolve(this.port.lifecycle.cleanup(reason, error)).then(() => undefined);
    return this.cleanupTask;
  }

  private async runCommands(commands: readonly BattlePresentationCommand[]): Promise<void> {
    for (const command of commands) await this.runCommand(command);
  }

  private async runCommand(command: BattlePresentationCommand): Promise<void> {
    this.throwIfCancelled();
    switch (command.kind) {
      case 'sequence':
        await this.runCommands(command.commands);
        return;
      case 'parallel':
        await Promise.all(command.commands.map((child) => this.runCommand(child)));
        return;
      case 'text':
        if (command.mode === 'log') {
          this.port.text.log(command.text);
          return;
        }
        await this.raceCancellation(
          this.port.text.say(
            command.text,
            command.mode === 'say-wait' ? 'wait' : 'auto',
            this.controller.signal,
          ),
        );
        return;
      case 'wait':
        if (this.fastForward) return;
        await this.waitOrSkip(command.ms);
        return;
      case 'visual':
        await this.raceCancellation(
          this.port.visual.play(command, {
            signal: this.controller.signal,
            fastForward: this.fastForward,
          }),
        );
        return;
      case 'audio':
        await this.raceCancellation(
          this.port.audio.withDucked(() => this.runCommands(command.commands), this.controller.signal),
        );
        return;
    }
  }

  private waitOrSkip(ms: number): Promise<void> {
    const skipSignal = this.skipController.signal;
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (error?: unknown) => {
        if (done) return;
        done = true;
        this.controller.signal.removeEventListener('abort', onCancel);
        skipSignal.removeEventListener('abort', onSkip);
        if (error) reject(error);
        else resolve();
      };
      const onCancel = () => finish(this.cancelledError());
      const onSkip = () => finish();
      this.controller.signal.addEventListener('abort', onCancel, { once: true });
      skipSignal.addEventListener('abort', onSkip, { once: true });
      Promise.resolve(this.port.clock.wait(ms, this.controller.signal)).then(
        () => finish(),
        (error) => finish(error),
      );
      if (this.controller.signal.aborted) onCancel();
      else if (skipSignal.aborted) onSkip();
    });
  }

  private raceCancellation<T>(task: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (error: unknown, value?: T) => {
        if (done) return;
        done = true;
        this.controller.signal.removeEventListener('abort', onCancel);
        if (error) reject(error);
        else resolve(value as T);
      };
      const onCancel = () => finish(this.cancelledError());
      this.controller.signal.addEventListener('abort', onCancel, { once: true });
      Promise.resolve(task).then(
        (value) => finish(null, value),
        (error) => finish(error),
      );
      if (this.controller.signal.aborted) onCancel();
    });
  }

  private throwIfCancelled(): void {
    if (this.controller.signal.aborted) throw this.cancelledError();
  }

  private cancelledError(): BattlePresentationCancelledError {
    return new BattlePresentationCancelledError(this.closedReason ?? 'cancelled');
  }
}
