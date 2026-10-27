import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { makeMonster } from '../../src/core/battle/factory';
import { applyBattleResult, type BattleSummary } from '../../src/core/progression/battleResult';
import {
  settleBattleBag,
  settleBattleOnce,
  syncCappedLevels,
} from '../../src/core/progression/battleSettlement';
import { partyFromGameState } from '../../src/core/battle/setup';
import { beginBattleResume, checkpointBattleResume } from '../../src/core/state/battleResume';
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

async function resumableBattle(game = createNewGame({ name: 'ハル', grade: 3 }, 1_000)) {
  const c = await content();
  game.seed = 'settlement-seed';
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
  battleState.outcome = 'victory';
  const started = beginBattleResume(game, {
    launch: {
      enemyId: enemy.id,
      level: 2,
      zone: 'field',
      encounterId: 'temporary',
      encounterSource: { type: 'random' },
    },
    battleState,
    questionSeed: 'question-seed',
    questionRngState: null,
    perfectBySubject: {},
  });
  const ready = checkpointBattleResume(started.state, started.snapshot.battleId, {
    battleState,
    questionRngState: null,
    perfectBySubject: {},
    phase: { kind: 'awaiting-result' },
  });
  return { c, state: ready, snapshot: ready.battle.active! };
}

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

describe('battle settlement ledger', () => {
  it('同一battleIdの勝利報酬と仲間加入を一度だけ反映する', async () => {
    const { c, state, snapshot } = await resumableBattle();
    const result = summary({
      xp: 12,
      gold: 34,
      drops: ['aomori-ringo'],
      recruitAccepted: true,
      perfectBySubject: { sansu: 2 },
    });

    const first = settleBattleOnce(
      state,
      { battleId: snapshot.battleId, sequence: snapshot.sequence, summary: result },
      c,
      2_000,
    );
    const second = settleBattleOnce(
      first.state,
      { battleId: snapshot.battleId, sequence: snapshot.sequence, summary: result },
      c,
      3_000,
    );

    expect(first.applied).toBe(true);
    expect(first.settlement?.state).toEqual(first.state);
    expect(first.state.player).toMatchObject({ xp: state.player.xp + 12, gold: state.player.gold + 34 });
    expect(first.state.inventory['aomori-ringo']).toBe((state.inventory['aomori-ringo'] ?? 0) + 1);
    expect(first.state.progress.counters['defeat:aomori-nebutan']).toBe(1);
    expect(first.state.progress.counters['perfect:sansu']).toBe(2);
    expect(first.state.progress.counters['recruit:aomori-nebutan']).toBe(1);
    expect(first.state.party.owned.filter((monster) => monster.monsterId === 'aomori-nebutan')).toHaveLength(
      1,
    );
    expect(first.state.battle.finalizedThrough).toBe(snapshot.sequence);
    expect(first.state.battle.active?.phase).toEqual({
      kind: 'settled',
      result: { outcome: 'victory', goldLost: 0 },
    });
    expect(second).toMatchObject({ applied: false, state: first.state, settlement: null });
    expect(second.state).toBe(first.state);
  });

  it('戦闘中に更新されたplaytimeとlearningを保持する', async () => {
    const { c, state, snapshot } = await resumableBattle();
    const latest = recordPlayDuration(state, '2026-10-27', 75, 1_500);
    latest.learning.mastery['sansu.g1.tashizan'] = { value: 1, n: 1, lastAt: 1_500 };

    const settled = settleBattleOnce(
      latest,
      {
        battleId: snapshot.battleId,
        sequence: snapshot.sequence,
        summary: summary({ gold: 10 }),
      },
      c,
      2_000,
    );

    expect(settled.state.learning.playSecondsByDate['2026-10-27']).toBe(75);
    expect(settled.state.learning.mastery['sansu.g1.tashizan']).toEqual({
      value: 1,
      n: 1,
      lastAt: 1_500,
    });
  });

  it('異なるbattleIdと古いsequenceの結果を無視する', async () => {
    const { c, state, snapshot } = await resumableBattle();

    const wrongId = settleBattleOnce(
      state,
      { battleId: 'stale.battle.1', sequence: snapshot.sequence, summary: summary({ gold: 99 }) },
      c,
    );
    const wrongSequence = settleBattleOnce(
      state,
      { battleId: snapshot.battleId, sequence: snapshot.sequence + 1, summary: summary({ gold: 99 }) },
      c,
    );

    expect(wrongId).toMatchObject({ applied: false, settlement: null });
    expect(wrongId.state).toBe(state);
    expect(wrongSequence.state).toBe(state);
  });

  it('敗北時のお金減少も同じledgerで一度だけ反映する', async () => {
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.player.gold = 1_000;
    const { c, state, snapshot } = await resumableBattle(game);
    const battleState = structuredClone(snapshot.battleState);
    battleState.outcome = 'defeat';
    const ready = checkpointBattleResume(state, snapshot.battleId, {
      battleState,
      questionRngState: null,
      perfectBySubject: {},
      phase: { kind: 'awaiting-result' },
    });
    const result = summary({ outcome: 'defeat' });

    const first = settleBattleOnce(
      ready,
      { battleId: snapshot.battleId, sequence: snapshot.sequence, summary: result },
      c,
    );
    const second = settleBattleOnce(
      first.state,
      { battleId: snapshot.battleId, sequence: snapshot.sequence, summary: result },
      c,
    );

    expect(first.goldLost).toBe(100);
    expect(first.state.player.gold).toBe(900);
    expect(second.state.player.gold).toBe(900);
    expect(second.applied).toBe(false);
  });
});
