import { describe, expect, it } from 'vitest';
import { applyLearningRewards, LEARNING_FRAGMENT_ID } from '../../src/core/progression/learningRewards';
import { createNewGame } from '../../src/core/state/newGame';

const outcome = (overrides: Partial<Parameters<typeof applyLearningRewards>[1]> = {}) => ({
  questionId: 'sansu.g1.tashizan.0001',
  unit: 'sansu.g1.tashizan',
  score: 1,
  wasMistakeBeforeAnswer: false,
  ...overrides,
});

describe('学習成果のまなびのかけら', () => {
  it('3回以上かつ習熟度0.80へ到達した単元ごとに一度だけ付与する', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.learning.mastery['sansu.g1.tashizan'] = { value: 0.8, n: 3, lastAt: 200 };

    const first = applyLearningRewards(game, outcome());
    const repeated = applyLearningRewards(first.state, outcome());

    expect(first.earned).toBe(1);
    expect(first.reasons).toEqual(['mastery']);
    expect(first.state.inventory[LEARNING_FRAGMENT_ID]).toBe(1);
    expect(first.state.learning.masteredRewardUnits).toEqual(['sansu.g1.tashizan']);
    expect(repeated).toMatchObject({ state: first.state, earned: 0, reasons: [] });
  });

  it('異なる3問のまちがい直しごとに1個付与し、同じ問題は再計上しない', () => {
    let game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    for (let index = 1; index <= 3; index += 1) {
      game = applyLearningRewards(
        game,
        outcome({
          questionId: `sansu.g1.tashizan.000${index}`,
          wasMistakeBeforeAnswer: true,
        }),
      ).state;
    }

    expect(game.inventory[LEARNING_FRAGMENT_ID]).toBe(1);
    expect(game.learning.correctedRewardQuestionIds).toHaveLength(3);
    const repeated = applyLearningRewards(
      game,
      outcome({ questionId: 'sansu.g1.tashizan.0003', wasMistakeBeforeAnswer: true }),
    );
    expect(repeated.earned).toBe(0);
    expect(repeated.state).toBe(game);
  });

  it('同じ回答で習熟到達と3問目の直しを達成すると2個付与する', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.learning.mastery['sansu.g1.tashizan'] = { value: 0.85, n: 3, lastAt: 200 };
    game.learning.correctedRewardQuestionIds = ['question.one', 'question.two'];

    const result = applyLearningRewards(
      game,
      outcome({ questionId: 'question.three', wasMistakeBeforeAnswer: true }),
    );

    expect(result.earned).toBe(2);
    expect(result.reasons).toEqual(['mastery', 'correction']);
    expect(result.state.inventory[LEARNING_FRAGMENT_ID]).toBe(2);
  });

  it('完全正解でない回答や、まちがい一覧になかった問題は直しに数えない', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    expect(
      applyLearningRewards(game, outcome({ score: 0.99, wasMistakeBeforeAnswer: true })).state.learning
        .correctedRewardQuestionIds,
    ).toEqual([]);
    expect(
      applyLearningRewards(game, outcome({ score: 1, wasMistakeBeforeAnswer: false })).state.learning
        .correctedRewardQuestionIds,
    ).toEqual([]);
  });
});
