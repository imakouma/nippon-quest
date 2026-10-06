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
      { t: 'victory', xp: 0, gold: 0, drops: [], recruitOffer: true, bonus: 1, maxCombo: 0 },
      'テストモンスター',
      game,
      c,
      () => '',
    );
    expect(view.recruitName).toBeUndefined();
  });

  it('敗北表示に失ったお金だけを渡す', () => {
    expect(defeatResultView(12)).toMatchObject({ kind: 'defeat', goldLost: 12, xp: 0, drops: [] });
  });
});
