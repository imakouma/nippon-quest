import { describe, expect, it, vi } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { makeMonster } from '../../src/core/battle/factory';
import { partyFromGameState } from '../../src/core/battle/setup';
import { beginBattleResume, type ActiveBattleResume } from '../../src/core/state/battleResume';
import { createNewGame } from '../../src/core/state/newGame';
import type { GameState } from '../../src/core/state/schema';
import type { EncounterLifecycle } from '../../src/scenes/overworld/encounterLifecycle';
import { PersistedEncounterRuntime } from '../../src/scenes/overworld/persistedEncounterRuntime';
import { content } from './helpers';

async function fixture() {
  const c = await content();
  let game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
  const enemy = c.monsters.get('aomori-nebutan')!;
  const battleState = createBattle(
    {
      ally: partyFromGameState(game, c),
      enemy: makeMonster(enemy, 2, 'enemy'),
      seed: 'battle-seed',
    },
    {
      settings: c.settings,
      elements: c.elements,
      skills: c.skills,
      items: c.items,
      monsters: c.monsters,
    },
  );
  const started = beginBattleResume(game, {
    launch: {
      enemyId: enemy.id,
      level: 2,
      zone: 'field',
      encounterId: 'field:1',
      encounterSource: { type: 'area-boss' },
    },
    battleState,
    questionSeed: 'question-seed',
    questionRngState: null,
    perfectBySubject: {},
  });
  game = started.state;
  const lifecycle: EncounterLifecycle = {
    active: null,
    start: vi.fn(async () => true),
    startInFlow: vi.fn(async () => null),
    resumeResult: vi.fn(async () => true),
    finish: vi.fn(async () => undefined),
    cancel: vi.fn(),
  };
  const commits: GameState[] = [];
  const runtime = new PersistedEncounterRuntime(
    lifecycle,
    () => game,
    {
      commit: async (state) => {
        game = state;
        commits.push(state);
      },
    },
    (enemyId) => c.monsters.has(enemyId),
  );
  return { commits, getGame: () => game, lifecycle, runtime, snapshot: started.snapshot };
}

function settled(snapshot: ActiveBattleResume): ActiveBattleResume {
  return {
    ...snapshot,
    phase: { kind: 'settled', result: { outcome: 'victory', goldLost: 0 } },
  };
}

describe('PersistedEncounterRuntime', () => {
  it('settled結果だけを既存lifecycleへ戻し、反映後にsnapshotを解放する', async () => {
    const f = await fixture();
    const snapshot = settled(f.snapshot);
    const current = f.getGame();
    Object.assign(current.battle, { active: snapshot, finalizedThrough: snapshot.sequence });

    await expect(f.runtime.resume(snapshot)).resolves.toBe('resumed');

    expect(f.lifecycle.start).not.toHaveBeenCalled();
    expect(f.lifecycle.resumeResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'field:1', source: { type: 'area-boss' } }),
      { outcome: 'victory', goldLost: 0 },
    );
    expect(f.getGame().battle.active).toBeNull();
    expect(f.commits).toHaveLength(1);
  });

  it('参照できない敵のsnapshotだけを破棄し、Battleを開始しない', async () => {
    const f = await fixture();
    const invalid = {
      ...f.snapshot,
      launch: { ...f.snapshot.launch, enemyId: 'removed-enemy' },
    };
    Object.assign(f.getGame().battle, { active: invalid });

    await expect(f.runtime.resume(invalid)).resolves.toBe('discarded');

    expect(f.lifecycle.start).not.toHaveBeenCalled();
    expect(f.lifecycle.resumeResult).not.toHaveBeenCalled();
    expect(f.getGame().battle.active).toBeNull();
    expect(f.commits).toHaveLength(1);
  });

  it('通常のbattle:endはfield lifecycle完了後にsettled snapshotを解放する', async () => {
    const f = await fixture();
    const snapshot = settled(f.snapshot);
    Object.assign(f.getGame().battle, { active: snapshot, finalizedThrough: snapshot.sequence });

    await f.runtime.finish({ encounterId: 'field:1', result: { outcome: 'victory', goldLost: 0 } });

    expect(f.lifecycle.finish).toHaveBeenCalledOnce();
    expect(f.getGame().battle.active).toBeNull();
    expect(f.commits).toHaveLength(1);
  });

  it('重複battle:endは同じfield完了を待ち、先にsnapshotを解放しない', async () => {
    const f = await fixture();
    const snapshot = settled(f.snapshot);
    Object.assign(f.getGame().battle, { active: snapshot, finalizedThrough: snapshot.sequence });
    let completeField!: () => void;
    const field = new Promise<void>((resolve) => {
      completeField = resolve;
    });
    f.lifecycle.finish = vi.fn(async () => field);
    const event = { encounterId: 'field:1', result: { outcome: 'victory' as const, goldLost: 0 } };

    const first = f.runtime.finish(event);
    const duplicate = f.runtime.finish(event);
    expect(duplicate).toBe(first);
    expect(f.commits).toHaveLength(0);

    completeField();
    await Promise.all([first, duplicate]);
    expect(f.lifecycle.finish).toHaveBeenCalledOnce();
    expect(f.commits).toHaveLength(1);
    expect(f.getGame().battle.active).toBeNull();
  });
});
