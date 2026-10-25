import { describe, expect, it, vi } from 'vitest';
import { fieldEventCommandSchema } from '../../src/core/content/schemas';
import {
  MapObjectMovementError,
  runMapObjectMovement,
  type MapObjectMovementCommand,
  type MapObjectMovementPorts,
  type MapObjectMovementReservation,
  type MapObjectMovementState,
} from '../../src/core/events/mapObjectMovementRuntime';

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function makePorts(overrides: Partial<MapObjectMovementPorts> = {}): MapObjectMovementPorts {
  return {
    prepare: vi.fn(async () => undefined),
    reserveStep: vi.fn(async () => ({ commit: vi.fn(), release: vi.fn() })),
    walk: vi.fn(async () => undefined),
    face: vi.fn(async () => undefined),
    wait: vi.fn(async () => undefined),
    emote: vi.fn(async () => undefined),
    setVisible: vi.fn(async () => undefined),
    cleanup: vi.fn(),
    ...overrides,
  };
}

function signal(): AbortSignal {
  return new AbortController().signal;
}

describe('runMapObjectMovement', () => {
  it('6 commandを順番にawaitし、明示状態と完了step数を返す', async () => {
    const calls: string[] = [];
    const states: MapObjectMovementState[] = [];
    const reservation: MapObjectMovementReservation = {
      commit: () => calls.push('commit'),
      release: () => calls.push('release'),
    };
    const ports = makePorts({
      prepare: async (objectId) => {
        calls.push(`prepare:${objectId}`);
      },
      reserveStep: async (objectId, direction) => {
        calls.push(`reserve:${objectId}:${direction}`);
        return reservation;
      },
      walk: async (objectId, direction, activeReservation) => {
        expect(activeReservation).toBe(reservation);
        calls.push(`walk:${objectId}:${direction}`);
      },
      face: async (objectId, direction) => {
        calls.push(`face:${objectId}:${direction}`);
      },
      wait: async (durationMs) => {
        calls.push(`wait:${durationMs}`);
      },
      emote: async (objectId, emote) => {
        calls.push(`emote:${objectId}:${emote}`);
      },
      setVisible: async (objectId, visible) => {
        calls.push(`visible:${objectId}:${visible}`);
      },
      cleanup: (objectId, error) => {
        expect(error).toBeUndefined();
        calls.push(`cleanup:${objectId}`);
      },
    });
    const commands: readonly MapObjectMovementCommand[] = [
      { type: 'face', direction: 'up' },
      { type: 'walk', direction: 'right' },
      { type: 'wait', durationMs: 120 },
      { type: 'emote', emote: 'notice' },
      { type: 'hide' },
      { type: 'show' },
    ];

    const result = await runMapObjectMovement('npc-guide', commands, ports, {
      signal: signal(),
      onStateChange: (state) => states.push(state),
    });

    expect(result).toEqual({ executedSteps: 6 });
    expect(calls).toEqual([
      'prepare:npc-guide',
      'face:npc-guide:up',
      'reserve:npc-guide:right',
      'walk:npc-guide:right',
      'commit',
      'wait:120',
      'emote:npc-guide:notice',
      'visible:npc-guide:false',
      'visible:npc-guide:true',
      'cleanup:npc-guide',
    ]);
    expect(states.map((state) => state.phase)).toEqual([
      'INIT',
      'WAITING_FOR_READY',
      'STARTING_COMMAND',
      'WAITING_FOR_COMPLETION',
      'ADVANCING',
      'STARTING_COMMAND',
      'WAITING_FOR_COMPLETION',
      'ADVANCING',
      'STARTING_COMMAND',
      'WAITING_FOR_COMPLETION',
      'ADVANCING',
      'STARTING_COMMAND',
      'WAITING_FOR_COMPLETION',
      'ADVANCING',
      'STARTING_COMMAND',
      'WAITING_FOR_COMPLETION',
      'ADVANCING',
      'STARTING_COMMAND',
      'WAITING_FOR_COMPLETION',
      'ADVANCING',
      'FINISHED',
    ]);
    expect(states.at(-1)).toMatchObject({ phase: 'FINISHED', outcome: 'completed', executedSteps: 6 });
  });

  it('現在commandのPromiseが完了するまで次commandを開始しない', async () => {
    const gate = deferred<void>();
    const wait = vi.fn(async () => undefined);
    const ports = makePorts({ face: () => gate.promise, wait });
    const running = runMapObjectMovement(
      'npc-guide',
      [
        { type: 'face', direction: 'left' },
        { type: 'wait', durationMs: 10 },
      ],
      ports,
      { signal: signal() },
    );

    await Promise.resolve();
    await Promise.resolve();
    expect(wait).not.toHaveBeenCalled();

    gate.resolve();
    await running;
    expect(wait).toHaveBeenCalledOnce();
  });

  it('予約できないwalkをBLOCKEDとして停止する', async () => {
    const walk = vi.fn(async () => undefined);
    const face = vi.fn(async () => undefined);
    const cleanup = vi.fn();
    const ports = makePorts({ reserveStep: async () => null, walk, face, cleanup });

    await expect(
      runMapObjectMovement(
        'npc-guide',
        [
          { type: 'walk', direction: 'down' },
          { type: 'face', direction: 'right' },
        ],
        ports,
        { signal: signal() },
      ),
    ).rejects.toMatchObject({ code: 'BLOCKED' });
    expect(walk).not.toHaveBeenCalled();
    expect(face).not.toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('walk失敗時は予約をreleaseし、commitも後続commandも実行しない', async () => {
    const reservation = { commit: vi.fn(), release: vi.fn() };
    const wait = vi.fn(async () => undefined);
    const error = new Error('tween failed');
    const ports = makePorts({
      reserveStep: async () => reservation,
      walk: async () => {
        throw error;
      },
      wait,
    });

    await expect(
      runMapObjectMovement(
        'npc-guide',
        [
          { type: 'walk', direction: 'up' },
          { type: 'wait', durationMs: 10 },
        ],
        ports,
        { signal: signal() },
      ),
    ).rejects.toBe(error);
    expect(reservation.release).toHaveBeenCalledOnce();
    expect(reservation.commit).not.toHaveBeenCalled();
    expect(wait).not.toHaveBeenCalled();
  });

  it('portがsignalを無視してもcaller abortでsettleし、cleanupを1回だけ行う', async () => {
    const controller = new AbortController();
    const cleanup = vi.fn();
    const started = deferred<void>();
    let portSignal: AbortSignal | undefined;
    const ports = makePorts({
      face: async (_objectId, _direction, activeSignal) => {
        portSignal = activeSignal;
        started.resolve();
        return new Promise<never>(() => undefined);
      },
      cleanup,
    });
    const running = runMapObjectMovement('npc-guide', [{ type: 'face', direction: 'down' }], ports, {
      signal: controller.signal,
    });
    await started.promise;

    const reason = new Error('scene shutdown');
    controller.abort(reason);

    await expect(running).rejects.toBe(reason);
    expect(portSignal?.aborted).toBe(true);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(cleanup).toHaveBeenCalledWith('npc-guide', reason);
  });

  it('開始前にabort済みならportを呼ばず同じreasonでrejectする', async () => {
    const controller = new AbortController();
    const reason = new Error('already stopped');
    controller.abort(reason);
    const cleanup = vi.fn();
    const ports = makePorts({ cleanup });

    await expect(
      runMapObjectMovement('npc-guide', [{ type: 'show' }, { type: 'hide' }], ports, {
        signal: controller.signal,
        maxSteps: 1,
      }),
    ).rejects.toBe(reason);
    expect(ports.prepare).not.toHaveBeenCalled();
    expect(ports.setVisible).not.toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('最大時間で未settle portをTIME_LIMITとして停止する', async () => {
    vi.useFakeTimers();
    try {
      const cleanup = vi.fn();
      const ports = makePorts({
        prepare: async () => new Promise<never>(() => undefined),
        cleanup,
      });
      const running = runMapObjectMovement('npc-guide', [], ports, {
        signal: signal(),
        maxDurationMs: 25,
      });
      const assertion = expect(running).rejects.toMatchObject({ code: 'TIME_LIMIT' });

      await vi.advanceTimersByTimeAsync(25);

      await assertion;
      expect(cleanup).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('最大step数を超える列はprepareやcommandを開始しない', async () => {
    const cleanup = vi.fn();
    const ports = makePorts({ cleanup });
    const commands: readonly MapObjectMovementCommand[] = [
      { type: 'face', direction: 'left' },
      { type: 'face', direction: 'right' },
    ];

    await expect(
      runMapObjectMovement('npc-guide', commands, ports, { signal: signal(), maxSteps: 1 }),
    ).rejects.toMatchObject({ code: 'STEP_LIMIT' });
    expect(ports.prepare).not.toHaveBeenCalled();
    expect(ports.face).not.toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('不正なwait時間をportへ渡さずINVALID_COMMANDにする', async () => {
    const ports = makePorts();

    await expect(
      runMapObjectMovement('npc-guide', [{ type: 'wait', durationMs: Number.POSITIVE_INFINITY }], ports, {
        signal: signal(),
      }),
    ).rejects.toMatchObject({ code: 'INVALID_COMMAND' });
    expect(ports.wait).not.toHaveBeenCalled();
  });

  it('cleanup例外と元の例外をAggregateErrorで失わない', async () => {
    const portError = new Error('face failed');
    const cleanupError = new Error('cleanup failed');
    const ports = makePorts({
      face: async () => {
        throw portError;
      },
      cleanup: () => {
        throw cleanupError;
      },
    });

    const error = await runMapObjectMovement('npc-guide', [{ type: 'face', direction: 'up' }], ports, {
      signal: signal(),
    }).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(AggregateError);
    expect((error as AggregateError).errors).toEqual([portError, cleanupError]);
  });

  it('error codeは安定したMapObjectMovementErrorで公開する', () => {
    expect(new MapObjectMovementError('BLOCKED', 'blocked')).toMatchObject({
      name: 'MapObjectMovementError',
      code: 'BLOCKED',
      message: 'blocked',
    });
  });

  it('content境界でmovement commandの6操作を検証する', () => {
    const command = fieldEventCommandSchema.parse({
      type: 'movement',
      objectId: 'npc_guide',
      commands: [
        { type: 'walk', direction: 'down' },
        { type: 'face', direction: 'left' },
        { type: 'wait', durationMs: 120 },
        { type: 'emote', emote: 'notice' },
        { type: 'hide' },
        { type: 'show' },
      ],
    });

    expect(command).toMatchObject({ type: 'movement', objectId: 'npc_guide' });
  });

  it('content境界で不正方向とstep上限超過を拒否する', () => {
    expect(() =>
      fieldEventCommandSchema.parse({
        type: 'movement',
        objectId: 'npc_guide',
        commands: [{ type: 'walk', direction: 'diagonal' }],
      }),
    ).toThrow();
    expect(() =>
      fieldEventCommandSchema.parse({
        type: 'movement',
        objectId: 'npc_guide',
        commands: Array.from({ length: 65 }, () => ({ type: 'show' })),
      }),
    ).toThrow();
  });
});
