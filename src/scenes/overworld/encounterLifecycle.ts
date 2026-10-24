import type { BattleEndPayload, BattleSceneData } from '../Battle';

export type EncounterSource =
  | { type: 'random' }
  | { type: 'mid-boss' }
  | { type: 'area-boss' }
  | { type: 'last-boss' }
  | { type: 'region-boss'; regionId: string }
  | { type: 'island-boss'; islandId: string }
  | { type: 'arena'; opponentId: string };

export interface EncounterContext {
  id: string;
  battle: BattleSceneData;
  source: EncounterSource;
}

export type EncounterResult = BattleEndPayload;

export type EncounterResultPolicy =
  | { type: 'continue' }
  | { type: 'complete-source' }
  | { type: 'respawn' }
  | { type: 'complete-arena'; won: boolean };

export function encounterResultPolicy(
  source: EncounterSource,
  result: EncounterResult,
): EncounterResultPolicy {
  switch (source.type) {
    case 'arena':
      return { type: 'complete-arena', won: result.outcome === 'victory' };
    case 'random':
      return result.outcome === 'defeat' ? { type: 'respawn' } : { type: 'continue' };
    case 'mid-boss':
    case 'area-boss':
    case 'last-boss':
    case 'region-boss':
    case 'island-boss':
      if (result.outcome === 'victory') return { type: 'complete-source' };
      return result.outcome === 'defeat' ? { type: 'respawn' } : { type: 'continue' };
  }
}

/** `field-flow-runtime` の公開契約だけを表すport。完成コミット取込後に実装を接続する。 */
export interface EncounterFlowContext {
  readonly signal: AbortSignal;
  throwIfCancelled(): void;
}

export interface EncounterFlowRuntimePort {
  run<T>(reason: string, action: (context: EncounterFlowContext) => Promise<T>): Promise<T | undefined>;
  cancel(reason?: unknown): void;
}

export interface EncounterLifecyclePorts {
  flow: EncounterFlowRuntimePort;
  prepareField(context: EncounterContext): Promise<void> | void;
  launchBattle(context: EncounterContext): Promise<void> | void;
  restoreField(context: EncounterContext): Promise<void> | void;
  applyResult(
    context: EncounterContext,
    result: EncounterResult,
    policy: EncounterResultPolicy,
  ): Promise<void> | void;
}

export interface EncounterLifecycle {
  readonly active: EncounterContext | null;
  start(context: EncounterContext): Promise<boolean>;
  finish(encounterId: string, result: EncounterResult): Promise<void>;
  cancel(): void;
}

interface ActiveEncounter {
  context: EncounterContext;
  enteredFlow: boolean;
  acceptingResult: boolean;
  result: Promise<EncounterResult>;
  resolveResult: (result: EncounterResult) => void;
  completed: Promise<void>;
  resolveCompleted: () => void;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function cancelled(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('Encounter cancelled', 'AbortError');
}

function waitForResult(active: ActiveEncounter, signal: AbortSignal): Promise<EncounterResult> {
  if (signal.aborted) return Promise.reject(cancelled(signal));
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(cancelled(signal));
    signal.addEventListener('abort', onAbort, { once: true });
    void active.result.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

class DefaultEncounterLifecycle implements EncounterLifecycle {
  private current: ActiveEncounter | null = null;

  constructor(private readonly ports: EncounterLifecyclePorts) {}

  get active(): EncounterContext | null {
    return this.current?.context ?? null;
  }

  async start(context: EncounterContext): Promise<boolean> {
    if (this.current) return false;

    const result = deferred<EncounterResult>();
    const completed = deferred<void>();
    const active: ActiveEncounter = {
      context,
      enteredFlow: false,
      acceptingResult: true,
      result: result.promise,
      resolveResult: result.resolve,
      completed: completed.promise,
      resolveCompleted: completed.resolve,
    };
    this.current = active;
    let started = false;

    try {
      await this.ports.flow.run(`encounter-${context.source.type}`, async (flow) => {
        started = true;
        active.enteredFlow = true;
        let restore: Promise<void> | null = null;
        let needsRestore = false;
        const restoreOnce = () =>
          (restore ??= Promise.resolve()
            .then(() => this.ports.restoreField(context))
            .then(() => undefined));

        try {
          flow.throwIfCancelled();
          needsRestore = true;
          await this.ports.prepareField(context);
          flow.throwIfCancelled();
          await this.ports.launchBattle(context);
          const battleResult = await waitForResult(active, flow.signal);
          flow.throwIfCancelled();
          await restoreOnce();
          await this.ports.applyResult(
            context,
            battleResult,
            encounterResultPolicy(context.source, battleResult),
          );
        } finally {
          if (needsRestore) await restoreOnce();
        }
      });
      return started;
    } finally {
      if (this.current === active) this.current = null;
      active.acceptingResult = false;
      active.resolveCompleted();
    }
  }

  async finish(encounterId: string, result: EncounterResult): Promise<void> {
    const active = this.current;
    if (!active || !active.acceptingResult || active.context.id !== encounterId) return;
    active.acceptingResult = false;
    active.resolveResult(result);
    await active.completed;
  }

  cancel(): void {
    if (!this.current) return;
    this.current.acceptingResult = false;
    if (this.current.enteredFlow) this.ports.flow.cancel();
  }
}

export function createEncounterLifecycle(ports: EncounterLifecyclePorts): EncounterLifecycle {
  return new DefaultEncounterLifecycle(ports);
}
