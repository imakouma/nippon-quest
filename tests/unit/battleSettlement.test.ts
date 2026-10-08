import { describe, expect, it } from 'vitest';
import { applyBattleResult, type BattleSummary } from '../../src/core/progression/battleResult';
import { settleBattleBag } from '../../src/core/progression/battleSettlement';
import { createNewGame } from '../../src/core/state/newGame';
import { recordPlayDuration } from '../../src/core/state/playTime';
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

  it('戦闘中に記録されたプレイ時間を結果反映後も保持する', async () => {
    const c = await content();
    const started = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    const latest = recordPlayDuration(started, '2026-10-08', 75, 2_000);

    const applied = applyBattleResult(latest, summary({ gold: 10 }), c.settings, 3_000);
    const settled = settleBattleBag(latest, applied, c);

    expect(settled.state.learning.playSecondsByDate['2026-10-08']).toBe(75);
    expect(settled.state.player.gold).toBe(started.player.gold + 10);
  });

  it('経験値で到達したレベルをセーブ状態にも反映する', async () => {
    const c = await content();
    const before = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    const applied = applyBattleResult(before, summary({ xp: c.xp.hero[1]! }), c.settings, 2_000);

    const settled = settleBattleBag(before, applied, c);
    expect(settled.level.after).toBe(2);
    expect(settled.state.player.level).toBe(2);
  });

  it('勝利経験値を出撃した仲間だけに与え、モンスター用経験値表でレベルを上げる', async () => {
    const c = await content();
    const before = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    before.party.owned.push(
      { uid: 'deployed', monsterId: 'aomori-ringoron', level: 1, xp: 0 },
      { uid: 'reserve', monsterId: 'aomori-senbein', level: 1, xp: 0 },
    );
    const earned = c.xp.monster[1]!;
    const applied = applyBattleResult(
      before,
      summary({ xp: earned, participantMonsterUids: ['deployed'] }),
      c.settings,
      2_000,
    );

    const settled = settleBattleBag(before, applied, c);
    expect(settled.state.party.owned.find((monster) => monster.uid === 'deployed')).toMatchObject({
      xp: earned,
      level: 2,
    });
    expect(settled.state.party.owned.find((monster) => monster.uid === 'reserve')).toMatchObject({
      xp: 0,
      level: 1,
    });
    expect(settled.monsterLevelUps).toEqual([{ uid: 'deployed', before: 1, after: 2 }]);
  });
});
