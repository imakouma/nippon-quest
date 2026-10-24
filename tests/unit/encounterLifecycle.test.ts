import { describe, expect, it, vi } from 'vitest';
import type { BattleEndPayload, BattleSceneData } from '../../src/scenes/Battle';
import {
  createEncounterLifecycle,
  encounterResultPolicy,
  type EncounterContext,
  type EncounterFlowContext,
  type EncounterFlowRuntimePort,
  type EncounterLifecyclePorts,
  type EncounterSource,
} from '../../src/scenes/overworld/encounterLifecycle';

const battle: BattleSceneData = {
  enemyId: 'aomori-ringoron',
  level: 1,
  zone: 'field',
};

const context = (id: string, source: EncounterSource = { type: 'random' }): EncounterContext => ({
  id,
  battle,
  source,
});

const result = (outcome: BattleEndPayload['outcome']): BattleEndPayload => ({ outcome, goldLost: 0 });

const sources: EncounterSource[] = [
  { type: 'random' },
  { type: 'mid-boss' },
  { type: 'area-boss' },
  { type: 'last-boss' },
  { type: 'region-boss', regionId: 'aomori-nebuta' },
  { type: 'island-boss', islandId: 'tohoku' },
  { type: 'arena', opponentId: 'rival-1' },
];

function flowHarness(): EncounterFlowRuntimePort & { releases: number; errors: unknown[] } {
  let running = false;
  let controller: AbortController | null = null;
  const harness: EncounterFlowRuntimePort & { releases: number; errors: unknown[] } = {
    releases: 0,
    errors: [],
    async run<T>(
      _reason: string,
      action: (flow: EncounterFlowContext) => Promise<T>,
    ): Promise<T | undefined> {
      if (running) return undefined;
      running = true;
      controller = new AbortController();
      try {
        return await action({
          signal: controller.signal,
          throwIfCancelled: () => controller?.signal.throwIfAborted(),
        });
      } catch (error) {
        harness.errors.push(error);
        return undefined;
      } finally {
        harness.releases += 1;
        running = false;
        controller = null;
      }
    },
    cancel(reason?: unknown): void {
      controller?.abort(reason);
    },
  };
  return harness;
}

function lifecycleHarness(overrides: Partial<EncounterLifecyclePorts> = {}) {
  const flow = flowHarness();
  const calls: string[] = [];
  const ports: EncounterLifecyclePorts = {
    flow,
    prepareField: vi.fn(async (encounter) => {
      calls.push(`prepare:${encounter.id}`);
    }),
    launchBattle: vi.fn(async (encounter) => {
      calls.push(`launch:${encounter.id}`);
    }),
    restoreField: vi.fn(async (encounter) => {
      calls.push(`restore:${encounter.id}`);
    }),
    applyResult: vi.fn(async (encounter, _result, policy) => {
      calls.push(`apply:${encounter.id}:${policy.type}`);
    }),
    ...overrides,
  };
  return { flow, calls, ports, lifecycle: createEncounterLifecycle(ports) };
}

describe('encounter result policy', () => {
  it('通常戦の勝利はBattle側の通常報酬だけで、敗北時だけ復帰地点へ移す', () => {
    expect(encounterResultPolicy({ type: 'random' }, result('victory'))).toEqual({ type: 'continue' });
    expect(encounterResultPolicy({ type: 'random' }, result('defeat'))).toEqual({ type: 'respawn' });
  });

  it.each(sources.filter((source) => source.type !== 'random' && source.type !== 'arena'))(
    '$type は勝利時だけsource固有進行を反映し、敗北時は復帰地点へ移す',
    (source) => {
      expect(encounterResultPolicy(source, result('victory'))).toEqual({ type: 'complete-source' });
      expect(encounterResultPolicy(source, result('defeat'))).toEqual({ type: 'respawn' });
    },
  );

  it('対戦場は勝敗を対戦場処理へ渡し、敗北しても復帰地点へ移さない', () => {
    const arena: EncounterSource = { type: 'arena', opponentId: 'rival-1' };
    expect(encounterResultPolicy(arena, result('victory'))).toEqual({ type: 'complete-arena', won: true });
    expect(encounterResultPolicy(arena, result('defeat'))).toEqual({ type: 'complete-arena', won: false });
  });

  it.each(sources)('$type の逃走・仲間化は追加の進行や敗北ワープを行わない', (source) => {
    const expected = source.type === 'arena' ? { type: 'complete-arena', won: false } : { type: 'continue' };
    expect(encounterResultPolicy(source, result('fled'))).toEqual(expected);
    expect(encounterResultPolicy(source, result('recruited'))).toEqual(expected);
  });
});

describe('encounter lifecycle', () => {
  it('同時に二つのencounterを開始しない', async () => {
    const { lifecycle } = lifecycleHarness();
    const first = lifecycle.start(context('enc-1'));

    await vi.waitFor(() => expect(lifecycle.active?.id).toBe('enc-1'));
    await expect(lifecycle.start(context('enc-2'))).resolves.toBe(false);

    await lifecycle.finish('enc-1', result('victory'));
    await expect(first).resolves.toBe(true);
  });

  it('field flowが別処理で使用中なら開始を拒否し、その処理をcancelしない', async () => {
    const flow: EncounterFlowRuntimePort = {
      run: vi.fn(async () => undefined),
      cancel: vi.fn(),
    };
    const { lifecycle } = lifecycleHarness({ flow });

    await expect(lifecycle.start(context('enc-1'))).resolves.toBe(false);
    lifecycle.cancel();

    expect(flow.cancel).not.toHaveBeenCalled();
    expect(lifecycle.active).toBeNull();
  });

  it('一致する最初のresultだけを一度だけ反映する', async () => {
    const { lifecycle, ports, calls } = lifecycleHarness();
    const started = lifecycle.start(context('enc-1', { type: 'mid-boss' }));

    await vi.waitFor(() => expect(lifecycle.active?.id).toBe('enc-1'));
    await lifecycle.finish('old-encounter', result('victory'));
    expect(ports.applyResult).not.toHaveBeenCalled();

    const firstFinish = lifecycle.finish('enc-1', result('victory'));
    await lifecycle.finish('enc-1', result('defeat'));
    await firstFinish;
    await expect(started).resolves.toBe(true);

    expect(ports.applyResult).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['prepare:enc-1', 'launch:enc-1', 'restore:enc-1', 'apply:enc-1:complete-source']);
  });

  it('cancel後に届いたresultを無視し、fieldを復帰する', async () => {
    const { lifecycle, ports, flow } = lifecycleHarness();
    const started = lifecycle.start(context('enc-1'));

    await vi.waitFor(() => expect(lifecycle.active?.id).toBe('enc-1'));
    lifecycle.cancel();
    await lifecycle.finish('enc-1', result('victory'));
    await expect(started).resolves.toBe(true);

    expect(ports.restoreField).toHaveBeenCalledTimes(1);
    expect(ports.applyResult).not.toHaveBeenCalled();
    expect(flow.releases).toBe(1);
  });

  it('準備中のcancelでもstartの完了前にfieldを一度だけ復帰する', async () => {
    let finishPrepare!: () => void;
    const preparing = new Promise<void>((resolve) => {
      finishPrepare = resolve;
    });
    const { lifecycle, ports } = lifecycleHarness({
      prepareField: vi.fn(() => preparing),
    });
    const started = lifecycle.start(context('enc-1'));

    await vi.waitFor(() => expect(ports.prepareField).toHaveBeenCalledTimes(1));
    lifecycle.cancel();
    finishPrepare();
    await expect(started).resolves.toBe(true);

    expect(ports.restoreField).toHaveBeenCalledTimes(1);
    expect(ports.launchBattle).not.toHaveBeenCalled();
  });

  it('Battle起動に失敗してもfieldを復帰し、次のencounterを開始できる', async () => {
    let launches = 0;
    const { lifecycle, ports, flow } = lifecycleHarness({
      launchBattle: vi.fn(async () => {
        launches += 1;
        if (launches === 1) throw new Error('launch failed');
      }),
    });

    await expect(lifecycle.start(context('enc-1'))).resolves.toBe(true);
    expect(ports.restoreField).toHaveBeenCalledTimes(1);
    expect(flow.errors).toHaveLength(1);

    const second = lifecycle.start(context('enc-2'));
    await vi.waitFor(() => expect(lifecycle.active?.id).toBe('enc-2'));
    await lifecycle.finish('enc-2', result('victory'));
    await expect(second).resolves.toBe(true);
  });

  it('result反映に失敗してもrestoreとfield flow解放を一度だけ行う', async () => {
    const { lifecycle, ports, flow } = lifecycleHarness({
      applyResult: vi.fn(async () => {
        throw new Error('apply failed');
      }),
    });
    const started = lifecycle.start(context('enc-1'));

    await vi.waitFor(() => expect(lifecycle.active?.id).toBe('enc-1'));
    await lifecycle.finish('enc-1', result('victory'));
    await expect(started).resolves.toBe(true);

    expect(ports.restoreField).toHaveBeenCalledTimes(1);
    expect(flow.releases).toBe(1);
    expect(flow.errors).toHaveLength(1);
  });
});
