import { describe, expect, it } from 'vitest';
import type { BattleSummary } from '../../src/core/progression/battleResult';
import { createNewGame } from '../../src/core/state/newGame';
import { chooseStoryCompanion } from '../../src/core/progression/storyCompanion';
import { defeatResultView, victoryResultView } from '../../src/scenes/battle/resultView';
import { content } from './helpers';

describe('バトル結果の表示モデル', () => {
  it('同じドロップをまとめ、経験値表示と仲間化候補を作る', async () => {
    const c = await content();
    const game = chooseStoryCompanion(createNewGame({ name: 'ハル', grade: 3 }, 1_000), 'iwate-kagurabi');
    const summary: BattleSummary = {
      outcome: 'victory',
      enemyRefId: 'enemy',
      enemyLevel: 1,
      heroHp: 30,
      heroMp: 5,
      heroMaxHp: 40,
      heroMaxMp: 10,
      xp: 12,
      gold: 8,
      drops: ['common-tetsu', 'common-tetsu'],
      items: {},
      recruitAccepted: false,
      perfectBySubject: {},
    };
    const view = victoryResultView(
      summary,
      {
        t: 'victory',
        actionId: 'turn:1:action:0',
        xp: 12,
        gold: 8,
        drops: summary.drops,
        recruitOffer: true,
        bonus: 1.2,
        maxCombo: 3,
      },
      'テストモンスター',
      game,
      c,
      (item) => `icon:${item.id}`,
    );
    expect(view.drops).toEqual([
      { name: c.items.get('common-tetsu')!.name, count: 2, icon: 'icon:common-tetsu' },
    ]);
    expect(view).toMatchObject({ recruitName: 'テストモンスター', bonus: 1.2, maxCombo: 3 });
  });

  it('岩手で相棒を選ぶ前は勝利後の勧誘を表示しない', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 1 });
    const view = victoryResultView(
      {
        outcome: 'victory',
        enemyRefId: 'enemy',
        enemyLevel: 1,
        heroHp: 40,
        heroMp: 10,
        heroMaxHp: 40,
        heroMaxMp: 10,
        xp: 0,
        gold: 0,
        drops: [],
        items: {},
        recruitAccepted: false,
        perfectBySubject: {},
      },
      {
        t: 'victory',
        actionId: 'turn:1:action:0',
        xp: 0,
        gold: 0,
        drops: [],
        recruitOffer: true,
        bonus: 1,
        maxCombo: 0,
      },
      'テストモンスター',
      game,
      c,
      () => '',
    );
    expect(view.recruitName).toBeUndefined();
  });

  it('レベルアップ後のレベルと繰り越し経験値を表示する', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 1 });
    game.player.xp = c.xp.hero[1]! - 2;
    const gainedXp = 5;
    const view = victoryResultView(
      {
        outcome: 'victory',
        enemyRefId: 'enemy',
        enemyLevel: 1,
        heroHp: 40,
        heroMp: 10,
        heroMaxHp: 40,
        heroMaxMp: 10,
        xp: gainedXp,
        gold: 0,
        drops: [],
        items: {},
        recruitAccepted: false,
        perfectBySubject: {},
      },
      {
        t: 'victory',
        actionId: 'turn:1:action:0',
        xp: gainedXp,
        gold: 0,
        drops: [],
        recruitOffer: false,
        bonus: 1,
        maxCombo: 0,
      },
      'テストモンスター',
      game,
      c,
      () => '',
    );

    expect(view.xpFrom).toBe(0);
    expect(view.level).toBe(2);
    expect(view.levelFrom).toBe(1);
    expect(view.leveledUp).toBe(true);
    expect(view.levelXp).toBe(3);
    expect(view.levelXpNeeded).toBe(c.xp.hero[2]! - c.xp.hero[1]!);
    expect(view.xpTo).toBeCloseTo(3 / view.levelXpNeeded!);
    expect(view.needNext).toBe(c.xp.hero[2]! - c.xp.hero[1]! - 3);
  });

  it('上限では繰り越しを失わず次レベルの必要量を表示しない', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 1 });
    game.player.level = 2;
    game.player.levelCap = 2;
    game.player.xp = c.xp.hero[1]! + 10;
    const summary: BattleSummary = {
      outcome: 'victory',
      enemyRefId: 'enemy',
      enemyLevel: 1,
      heroHp: 40,
      heroMp: 10,
      heroMaxHp: 40,
      heroMaxMp: 10,
      xp: 7,
      gold: 0,
      drops: [],
      items: {},
      recruitAccepted: false,
      perfectBySubject: {},
    };
    const view = victoryResultView(summary, null, 'テスト', game, c, () => '');
    expect(view).toMatchObject({
      level: 2,
      levelFrom: 2,
      leveledUp: false,
      levelXp: 17,
      levelXpNeeded: undefined,
      needNext: 0,
    });
  });

  it('複数レベル上昇後も最終レベルの経験値を表示する', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 1 });
    const summary: BattleSummary = {
      outcome: 'victory',
      enemyRefId: 'enemy',
      enemyLevel: 1,
      heroHp: 40,
      heroMp: 10,
      heroMaxHp: 40,
      heroMaxMp: 10,
      xp: c.xp.hero[3]! + 2,
      gold: 0,
      drops: [],
      items: {},
      recruitAccepted: false,
      perfectBySubject: {},
    };
    const view = victoryResultView(summary, null, 'テスト', game, c, () => '');
    expect(view).toMatchObject({
      level: 4,
      levelFrom: 1,
      leveledUp: true,
      levelXp: 2,
      needNext: c.xp.hero[4]! - c.xp.hero[3]! - 2,
    });
  });

  it('敗北表示に失ったお金だけを渡す', () => {
    expect(defeatResultView(12)).toMatchObject({ kind: 'defeat', goldLost: 12, xp: 0, drops: [] });
  });
});
