import { describe, expect, it } from 'vitest';
import { applyFirstBossReward, markDone, TRIAL_CORE_ID } from '../../src/core/progression/eventReward';
import { completeIsland } from '../../src/core/progression/island';
import { createNewGame } from '../../src/core/state/newGame';
import { content } from './helpers';

describe('強敵の初回しれん報酬', () => {
  it.each([
    ['regionboss.aomori.towada', 1],
    ['midboss.aomori', 1],
    ['boss.aomori', 2],
    ['lastboss.aomori', 3],
  ])('%s の初回だけ核を %i 個付与する', (flag, count) => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    const complete = (state: typeof game) => markDone(state, { flag });

    const first = applyFirstBossReward(game, complete, count);
    const repeated = applyFirstBossReward(first.state, complete, count);

    expect(first.awarded).toBe(count);
    expect(first.state.progress.eventsDone).toContain(flag);
    expect(first.state.inventory[TRIAL_CORE_ID]).toBe(count);
    expect(repeated).toEqual({ state: first.state, awarded: 0 });
  });

  it('地方ボスは島クリア進行を保ったまま初回だけ4個付与する', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'tohoku')!.areas];
    const complete = (state: typeof game) => completeIsland(state, c.world, 'tohoku', 200);

    const first = applyFirstBossReward(game, complete, 4);
    const repeated = applyFirstBossReward(first.state, complete, 4);

    expect(first.state.progress.islandsCleared).toEqual(['tohoku']);
    expect(first.state.progress.counters['visit:hokkaido-field']).toBe(1);
    expect(first.state.inventory[TRIAL_CORE_ID]).toBe(4);
    expect(repeated).toEqual({ state: first.state, awarded: 0 });
  });
});
