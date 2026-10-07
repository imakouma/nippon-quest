import { describe, expect, it } from 'vitest';
import { applyBattleResult, type BattleSummary } from '../../src/core/progression/battleResult';
import { settleBattleBag } from '../../src/core/progression/battleSettlement';
import { createNewGame } from '../../src/core/state/newGame';
import { chooseStoryCompanion } from '../../src/core/progression/storyCompanion';
import { content } from './helpers';

const summary = (overrides: Partial<BattleSummary> = {}): BattleSummary => ({
  outcome: 'victory',
  enemyRefId: 'aomori-nebutan',
  enemyLevel: 1,
  heroHp: 20,
  heroMp: 5,
  heroMaxHp: 20,
  heroMaxMp: 5,
  xp: 0,
  gold: 0,
  drops: [],
  items: {},
  recruitAccepted: false,
  perfectBySubject: {},
  ...overrides,
});

describe('バトル後のバッグ編成', () => {
  it('経験値後のレベルと、仲間になったモンスターの配置を純粋に決める', async () => {
    const c = await content();
    const before = chooseStoryCompanion(createNewGame({ name: 'ハル', grade: 3 }, 1_000), 'iwate-kagurabi');
    const applied = applyBattleResult(before, summary({ outcome: 'recruited' }), c.settings, 2_000);
    const settled = settleBattleBag(before, applied, c);
    expect(settled.level).toMatchObject({ before: 1, after: 1, bagGrew: false });
    expect(settled.state.party.owned.some((monster) => monster.uid === applied.newMonsterUid)).toBe(true);
    expect(settled.recruitStored).toBe(false);
    expect(before.party.owned).toHaveLength(1);
  });
});
