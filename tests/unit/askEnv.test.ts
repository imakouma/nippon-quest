// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { buildAskEnv, recordLearningResult } from '../../src/scenes/shared/askEnv';
import type { QuestionBase, QuestionResult } from '../../src/questions/contracts';
import type { ContentIndex } from '../../src/core/content/loader';
import { MasteryStore, type QuestionBank } from '../../src/questions/engine';

describe('問題結果の学習状態への記録', () => {
  it('回答履歴と更新時刻を同じ時点へ進める', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    const question: QuestionBase = {
      id: 'sansu.g1.tashizan.0001',
      type: 'choice',
      subject: 'sansu',
      grade: 1,
      unit: 'sansu.g1.tashizan',
      payload: {},
    };
    const result: QuestionResult = {
      questionId: question.id,
      score: 1,
      timeMs: 800,
      attempts: 1,
    };

    const event = recordLearningResult(game, question, result, 900, 1_000, 'battle');

    expect(game.learning.attempts).toEqual([event]);
    expect(game.updatedAt).toBe(1_000);
  });

  it('長い問題の途中で状態が差し替わっても、回答を最新版へ記録する', () => {
    const stale = createNewGame({ name: 'ハル', grade: 1 }, 100);
    const latest = structuredClone(stale);
    latest.learning.playSecondsByDate['2026-10-08'] = 60;
    const question: QuestionBase = {
      id: 'sansu.g1.tashizan.0001',
      type: 'choice',
      subject: 'sansu',
      grade: 1,
      unit: 'sansu.g1.tashizan',
      payload: {},
    };
    const result: QuestionResult = {
      questionId: question.id,
      score: 1,
      timeMs: 800,
      attempts: 1,
    };
    const env = buildAskEnv({
      host: document.createElement('div'),
      gs: stale,
      content: {
        settings: {
          timeLimitSecByGrade: { '1': 20 },
          recentQuestionWindow: 10,
          adaptiveWeakUnitRatio: 0.5,
        },
      } as unknown as ContentIndex,
      bank: {} as QuestionBank,
      mastery: new MasteryStore(stale.learning.mastery),
      rng: { next: () => 0 },
      speak: () => {},
      getGame: () => latest,
    });

    env.onResult?.(question, result, 900);

    expect(latest.learning.attempts).toHaveLength(1);
    expect(latest.learning.playSecondsByDate['2026-10-08']).toBe(60);
    expect(stale.learning.attempts).toHaveLength(0);
  });
});
