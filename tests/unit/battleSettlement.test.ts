import { describe, expect, it } from 'vitest';
import { applyBattleResult, type BattleSummary } from '../../src/core/progression/battleResult';
import { settleBattleBag, syncCappedLevels } from '../../src/core/progression/battleSettlement';
import { partyFromGameState } from '../../src/core/battle/setup';
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

  it('加入個体の上限を種族初期値と加入レベル切り上げの大きい方にする', async () => {
    const c = await content();
    const species = [...c.monsters.values()].find((monster) => monster.initialLevelCap === 40)!;
    const before = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    const applied = applyBattleResult(
      before,
      summary({ outcome: 'recruited', enemyRefId: species.id, enemyLevel: 1 }),
      c.settings,
      2_000,
    );

    const settled = settleBattleBag(before, applied, c);

    expect(settled.state.party.owned.find((monster) => monster.uid === applied.newMonsterUid)?.levelCap).toBe(
      40,
    );

    const highLevelApplied = applyBattleResult(
      before,
      summary({ outcome: 'recruited', enemyRefId: species.id, enemyLevel: 51 }),
      c.settings,
      3_000,
    );
    const highLevelSettled = settleBattleBag(before, highLevelApplied, c);
    expect(
      highLevelSettled.state.party.owned.find((monster) => monster.uid === highLevelApplied.newMonsterUid)
        ?.levelCap,
    ).toBe(60);
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
      { uid: 'deployed', monsterId: 'aomori-ringoron', level: 1, levelCap: 10, xp: 0 },
      { uid: 'reserve', monsterId: 'aomori-senbein', level: 1, levelCap: 10, xp: 0 },
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

  it('上限中はXPを保留し、解放後にHP・MP割合を保って一度に同期する', async () => {
    const c = await content();
    const before = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    before.player.level = 10;
    before.player.levelCap = 10;
    before.player.xp = c.xp.hero[9]!;
    before.party.owned.push({
      uid: 'deployed',
      monsterId: 'aomori-ringoron',
      level: 10,
      levelCap: 10,
      xp: c.xp.monster[9]!,
    });
    const earned = Math.max(c.xp.hero[19]!, c.xp.monster[19]!);
    const oldMax = partyFromGameState(before, c).hero.stats;
    before.player.hp = Math.floor(oldMax.hp / 2);
    before.player.mp = Math.floor(oldMax.mp / 2);
    const applied = applyBattleResult(
      before,
      summary({
        xp: earned,
        heroHp: before.player.hp,
        heroMp: before.player.mp,
        heroMaxHp: oldMax.hp,
        heroMaxMp: oldMax.mp,
        participantMonsterUids: ['deployed'],
      }),
      c.settings,
      2_000,
    );

    const capped = settleBattleBag(before, applied, c);
    expect(capped.state.player).toMatchObject({ level: 10, levelCap: 10, xp: c.xp.hero[9]! + earned });
    expect(capped.state.party.owned[0]).toMatchObject({
      level: 10,
      levelCap: 10,
      xp: c.xp.monster[9]! + earned,
    });

    const unlocked = structuredClone(capped.state);
    unlocked.player.levelCap = 20;
    unlocked.party.owned[0]!.levelCap = 20;
    const synced = syncCappedLevels(capped.state, unlocked, c);
    const newMax = partyFromGameState(synced.state, c).hero.stats;

    expect(synced.state.player.level).toBe(20);
    expect(synced.state.party.owned[0]?.level).toBe(20);
    expect(synced.state.player.xp).toBe(capped.state.player.xp);
    expect(synced.state.party.owned[0]?.xp).toBe(capped.state.party.owned[0]?.xp);
    expect(synced.state.player.hp / newMax.hp).toBeCloseTo(before.player.hp / oldMax.hp, 1);
    expect(synced.state.player.mp / newMax.mp).toBeCloseTo(before.player.mp / oldMax.mp, 1);
  });
});
