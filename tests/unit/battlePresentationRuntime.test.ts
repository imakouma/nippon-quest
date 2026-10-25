import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { BattleEvent } from '../../src/core/battle/types';
import {
  BattlePresentationCancelledError,
  BattlePresentationRuntime,
  compileBattlePresentation,
  type BattlePresentationPort,
} from '../../src/scenes/battle/presentationRuntime';
import type { NarrateCtx } from '../../src/scenes/battle/narrate';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

const ctx: NarrateCtx = {
  nameOf: (id) => id,
  skillName: (id) => id,
  itemName: (id) => id,
  elementName: (id) => id,
  subjectName: (id) => id,
  enemyName: 'enemy',
  isBossBattle: false,
};

beforeAll(() => {
  setDictionary({ battle: { attack: '{name} attacks' } } as I18nDict);
});

function createPort(overrides: Partial<BattlePresentationPort> = {}): BattlePresentationPort {
  return {
    text: {
      log: vi.fn(),
      say: vi.fn(async () => undefined),
    },
    clock: {
      wait: vi.fn(async () => undefined),
    },
    visual: {
      play: vi.fn(async () => undefined),
    },
    audio: {
      withDucked: vi.fn(async (play) => play()),
    },
    lifecycle: {
      cleanup: vi.fn(async () => undefined),
    },
    ...overrides,
  };
}

function turn(turnNumber: number): BattleEvent {
  return { t: 'turnStart', turn: turnNumber };
}

describe('battle presentation command compiler', () => {
  it('keeps event boundaries ordered while allowing only declared within-event parallelism', () => {
    const commands = compileBattlePresentation(
      [{ t: 'act', side: 'ally', actorId: 'hero', command: 'attack' }, turn(2)],
      ctx,
    );

    expect(commands).toHaveLength(2);
    expect(commands[0]).toMatchObject({ kind: 'parallel' });
    expect(commands[1]).toMatchObject({ kind: 'visual', event: { t: 'turnStart', turn: 2 } });
  });
});

describe('BattlePresentationRuntime', () => {
  it('plays batches and events in enqueue order', async () => {
    const order: number[] = [];
    const port = createPort({
      visual: {
        play: vi.fn(async (command) => {
          if (command.event.t === 'turnStart') order.push(command.event.turn);
        }),
      },
    });
    const runtime = new BattlePresentationRuntime(port);

    const first = runtime.enqueue([turn(1), turn(2)], ctx);
    const second = runtime.enqueue([turn(3)], ctx);
    expect(runtime.activeTaskCount).toBe(2);

    await Promise.all([first, second]);

    expect(order).toEqual([1, 2, 3]);
    expect(runtime.activeTaskCount).toBe(0);
  });

  it('cancels the running batch and every queued batch, then cleans up once', async () => {
    const port = createPort({
      visual: { play: vi.fn(() => new Promise<void>(() => undefined)) },
    });
    const runtime = new BattlePresentationRuntime(port);
    const first = runtime.enqueue([turn(1)], ctx);
    const second = runtime.enqueue([turn(2)], ctx);

    await runtime.cancel('cancelled');

    await expect(first).rejects.toBeInstanceOf(BattlePresentationCancelledError);
    await expect(second).rejects.toBeInstanceOf(BattlePresentationCancelledError);
    expect(runtime.activeTaskCount).toBe(0);
    expect(port.lifecycle.cleanup).toHaveBeenCalledTimes(1);
    expect(port.lifecycle.cleanup).toHaveBeenCalledWith('cancelled', undefined);
  });

  it('propagates a port failure, cancels later work, and cleans up once', async () => {
    const failure = new Error('visual failed');
    const port = createPort({
      visual: { play: vi.fn(async () => Promise.reject(failure)) },
    });
    const runtime = new BattlePresentationRuntime(port);
    const failed = runtime.enqueue([turn(1)], ctx);
    const queued = runtime.enqueue([turn(2)], ctx);

    await expect(failed).rejects.toBe(failure);
    await expect(queued).rejects.toBeInstanceOf(BattlePresentationCancelledError);
    expect(runtime.activeTaskCount).toBe(0);
    expect(port.lifecycle.cleanup).toHaveBeenCalledTimes(1);
    expect(port.lifecycle.cleanup).toHaveBeenCalledWith('error', failure);
  });

  it('settles active task accounting once when a port completes more than once', async () => {
    let complete!: () => void;
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => (markStarted = resolve));
    const port = createPort({
      visual: {
        play: vi.fn(
          () =>
            new Promise<void>((resolve) => {
              markStarted();
              complete = () => {
                resolve();
                resolve();
              };
            }),
        ),
      },
    });
    const onIdle = vi.fn();
    const runtime = new BattlePresentationRuntime(port, { onIdle });
    const task = runtime.enqueue([turn(1)], ctx);

    await started;
    complete();
    complete();
    await task;

    expect(runtime.activeTaskCount).toBe(0);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('scene shutdown aborts pending work, cleans up once, and rejects new work', async () => {
    const port = createPort({
      visual: { play: vi.fn(() => new Promise<void>(() => undefined)) },
    });
    const runtime = new BattlePresentationRuntime(port);
    const pending = runtime.enqueue([turn(1)], ctx);

    await runtime.dispose('shutdown');

    await expect(pending).rejects.toBeInstanceOf(BattlePresentationCancelledError);
    await expect(runtime.enqueue([turn(2)], ctx)).rejects.toBeInstanceOf(BattlePresentationCancelledError);
    expect(port.lifecycle.cleanup).toHaveBeenCalledTimes(1);
    expect(port.lifecycle.cleanup).toHaveBeenCalledWith('shutdown', undefined);
  });

  it('fast-forward skips automatic waits but keeps text and visual state application', async () => {
    const port = createPort();
    const runtime = new BattlePresentationRuntime(port);
    runtime.setFastForward(true);

    await runtime.enqueue([{ t: 'act', side: 'ally', actorId: 'hero', command: 'attack' }], ctx);

    expect(port.text.log).toHaveBeenCalledWith('hero attacks');
    expect(port.clock.wait).not.toHaveBeenCalled();
    expect(port.visual.play).toHaveBeenCalledTimes(1);
  });

  it('skipSkippable releases the current automatic wait without skipping the visual', async () => {
    let waitStarted!: () => void;
    const started = new Promise<void>((resolve) => (waitStarted = resolve));
    const port = createPort({
      clock: {
        wait: vi.fn(() => {
          waitStarted();
          return new Promise<void>(() => undefined);
        }),
      },
    });
    const runtime = new BattlePresentationRuntime(port);
    const task = runtime.enqueue([{ t: 'act', side: 'ally', actorId: 'hero', command: 'attack' }], ctx);

    await started;
    runtime.skipSkippable();
    await task;

    expect(port.visual.play).toHaveBeenCalledTimes(1);
    expect(runtime.activeTaskCount).toBe(0);
  });
});
