import { describe, expect, it } from 'vitest';
import { applyLearningRewards, LEARNING_FRAGMENT_ID } from '../../src/core/learning/learningRewards';
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
    expect(first.state.dex.items).toContain(LEARNING_FRAGMENT_ID);
    expect(first.state.learning.masteredRewardUnits).toEqual(['sansu.g1.tashizan']);
    expect(repeated).toMatchObject({ state: first.state, earned: 0, reasons: [] });
  });

  it.each([
    [0.79, 3],
    [0.8, 2],
  ])('習熟度 %s、回数 %s では習熟報酬を付与しない', (value, n) => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.learning.mastery['sansu.g1.tashizan'] = { value, n, lastAt: 200 };

    expect(applyLearningRewards(game, outcome())).toEqual({ state: game, earned: 0, reasons: [] });
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

  it('legacy 習熟を legacy 回答で一度だけ付与し、current marker へ収束する', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.learning.mastery['sansu.g1.legacy-math-1-2'] = { value: 0.8, n: 3, lastAt: 200 };
    const before = structuredClone(game);

    const first = applyLearningRewards(game, outcome({ unit: 'math_1_2' }));
    const repeated = applyLearningRewards(first.state, outcome());

    expect(game).toEqual(before);
    expect(first.earned).toBe(1);
    expect(first.state.learning.masteredRewardUnits).toEqual(['sansu.g1.tashizan']);
    expect(Object.keys(first.state.learning.mastery)).toEqual(['sansu.g1.legacy-math-1-2']);
    expect(repeated).toEqual({ state: first.state, earned: 0, reasons: [] });
  });

  it.each([
    {
      label: 'current 習熟 + legacy question 回答',
      mastery: { 'sansu.g1.tashizan': { value: 0.8, n: 3, lastAt: 200 } },
      unit: 'sansu.g1.legacy-math-1-2',
    },
    {
      label: 'mixed 習熟 + raw legacy 回答',
      mastery: {
        'sansu.g1.tashizan': { value: 0.6, n: 2, lastAt: 100 },
        math_1_2: { value: 1, n: 2, lastAt: 200 },
      },
      unit: 'math_1_2',
    },
  ])('$label でも正規単元へ一度だけ付与する', ({ mastery, unit }) => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    Object.assign(game.learning.mastery, mastery);

    const result = applyLearningRewards(game, outcome({ unit }));

    expect(result.earned).toBe(1);
    expect(result.reasons).toEqual(['mastery']);
    expect(result.state.learning.masteredRewardUnits).toEqual(['sansu.g1.tashizan']);
  });

  it('legacy marker を検出して再付与せず、触れた同値 marker だけ正規化する', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.learning.mastery['sansu.g1.tashizan'] = { value: 0.9, n: 4, lastAt: 200 };
    game.learning.masteredRewardUnits = ['unrelated.before', 'math_1_2', 'unrelated.after'];

    const normalized = applyLearningRewards(game, outcome({ unit: 'sansu.g1.legacy-math-1-2' }));
    const repeated = applyLearningRewards(normalized.state, outcome());

    expect(normalized.earned).toBe(0);
    expect(normalized.reasons).toEqual([]);
    expect(normalized.state).not.toBe(game);
    expect(normalized.state.learning.masteredRewardUnits).toEqual([
      'unrelated.before',
      'sansu.g1.tashizan',
      'unrelated.after',
    ]);
    expect(repeated).toEqual({ state: normalized.state, earned: 0, reasons: [] });
  });

  it('mixed 習熟と重複 marker を一単元として扱い、最初の位置へ正規化する', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.learning.mastery['sansu.g1.tashizan'] = { value: 0.7, n: 2, lastAt: 100 };
    game.learning.mastery.math_1_2 = { value: 1, n: 2, lastAt: 200 };
    game.learning.masteredRewardUnits = [
      'unrelated.before',
      'math_1_2',
      'unrelated.middle',
      'sansu.g1.tashizan',
      'sansu.g1.legacy-math-1-2',
      'unrelated.after',
    ];

    const result = applyLearningRewards(game, outcome());

    expect(result.earned).toBe(0);
    expect(result.state.learning.masteredRewardUnits).toEqual([
      'unrelated.before',
      'sansu.g1.tashizan',
      'unrelated.middle',
      'unrelated.after',
    ]);
    expect(result.state.inventory[LEARNING_FRAGMENT_ID]).toBeUndefined();
  });

  it.each([
    ['sansu.g1.legacy-math-1-2', 'sansu.g1.tashizan'],
    ['sansu.g1.tashizan', 'math_1_2'],
  ])('習熟 %s と marker %s を同じ単元として再付与しない', (masteryUnit, markerUnit) => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.learning.mastery[masteryUnit] = { value: 0.8, n: 3, lastAt: 200 };
    game.learning.masteredRewardUnits = [markerUnit];

    const result = applyLearningRewards(game, outcome({ unit: masteryUnit }));

    expect(result.earned).toBe(0);
    expect(result.state.learning.masteredRewardUnits).toEqual(['sansu.g1.tashizan']);
  });

  it('現行セーブの習熟キーと学習履歴、進行状態を変更しない', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.learning.mastery.math_1_2 = { value: 0.8, n: 3, lastAt: 200 };
    game.learning.attempts.push({
      id: 'attempt.old-question.90',
      profileId: 'local',
      questionId: 'old.question',
      presentedAt: 80,
      answeredAt: 90,
      score: 0,
      timeMs: 1000,
      attempts: 1,
      hintsUsed: 0,
      timedOut: false,
      reason: 'review',
      appVersion: 'test',
    });
    game.learning.recent = ['old.question'];
    game.learning.mistakes = ['old.question'];
    game.learning.masteredRewardUnits = ['unrelated.unit'];
    game.progress.counters['story.test'] = 2;
    const before = structuredClone(game);

    const result = applyLearningRewards(game, outcome({ unit: 'math_1_2' }));

    expect(game).toEqual(before);
    expect(result.state.schemaVersion).toBe(14);
    expect(result.state.learning.mastery).toEqual(before.learning.mastery);
    expect(result.state.learning.attempts).toEqual(before.learning.attempts);
    expect(result.state.learning.recent).toEqual(before.learning.recent);
    expect(result.state.learning.mistakes).toEqual(before.learning.mistakes);
    expect(result.state.progress).toEqual(before.progress);
    expect(result.state.learning.masteredRewardUnits).toEqual(['unrelated.unit', 'sansu.g1.tashizan']);
  });

  it('inventory を安全整数上限で飽和させ、dex item を重複登録しない', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.learning.mastery['sansu.g1.tashizan'] = { value: 0.8, n: 3, lastAt: 200 };
    game.inventory[LEARNING_FRAGMENT_ID] = Number.MAX_SAFE_INTEGER;
    game.dex.items = [LEARNING_FRAGMENT_ID];

    const result = applyLearningRewards(game, outcome());

    expect(result.state.inventory[LEARNING_FRAGMENT_ID]).toBe(Number.MAX_SAFE_INTEGER);
    expect(result.state.dex.items).toEqual([LEARNING_FRAGMENT_ID]);
  });
});
