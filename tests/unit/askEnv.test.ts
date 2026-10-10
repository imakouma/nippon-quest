// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { MAX_ATTEMPT_HISTORY } from '../../src/core/learning';
import { exportGameJson, MAX_GAME_IMPORT_CHARS } from '../../src/core/state/serialization';
import { buildAskEnv, recordLearningResult, type AskEnvOptions } from '../../src/scenes/shared/askEnv';
import type { QuestionBase, QuestionResult } from '../../src/questions/contracts';
import type { ContentIndex } from '../../src/core/content/loader';
import { MasteryStore, type QuestionBank } from '../../src/questions/engine';

describe('問題結果の学習状態への記録', () => {
  it('非同期回答を古い状態へ記録しないため、最新版の取得方法を必須にする', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);

    expect(() =>
      buildAskEnv({
        host: document.createElement('div'),
        gs: game,
        content: {
          settings: {
            timeLimitSecByGrade: { '1': 20 },
            recentQuestionWindow: 10,
            adaptiveWeakUnitRatio: 0.5,
          },
        } as unknown as ContentIndex,
        bank: {} as QuestionBank,
        mastery: new MasteryStore(game.learning.mastery),
        rng: { next: () => 0 },
        speak: () => {},
      } as unknown as AskEnvOptions),
    ).toThrow('getGame');
  });

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

  it('解答履歴は直近分だけを保持し、長期プレイでセーブを肥大化させない', () => {
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
    const oldest = recordLearningResult(game, question, result, 900, 1_000, 'battle');
    while (game.learning.attempts.length < MAX_ATTEMPT_HISTORY) {
      const sequence = game.learning.attempts.length;
      game.learning.attempts.push({ ...oldest, id: `old-${sequence}` });
    }

    const latest = recordLearningResult(game, question, result, 1_900, 2_000, 'review');

    expect(game.learning.attempts).toHaveLength(MAX_ATTEMPT_HISTORY);
    expect(game.learning.attempts).not.toContain(oldest);
    expect(game.learning.attempts.at(-1)).toBe(latest);
    expect(latest.id).toBe(`2000-${question.id}-${MAX_ATTEMPT_HISTORY}`);
    expect(exportGameJson(game).length).toBeLessThan(MAX_GAME_IMPORT_CHARS);
  });

  it('正答すると設定量だけかしこさが成長し、上限を超えない', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.player.bonusWis = 1.95;
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

    recordLearningResult(game, question, result, 900, 1_000, 'battle', {
      minScore: 0.8,
      perCorrect: 0.1,
      maxBonus: 2,
    });

    expect(game.player.bonusWis).toBe(2);
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
      score: 0.5,
      timeMs: 800,
      attempts: 1,
    };
    const mastery = new MasteryStore(stale.learning.mastery);
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
      mastery,
      rng: { next: () => 0 },
      speak: () => {},
      getGame: () => latest,
    });

    // ask() は onResult の直前に、問題開始時の MasteryStore へ記録する。
    mastery.record(question.unit, result, 950);
    stale.learning.recent.push(question.id);
    stale.learning.mistakes.push(question.id);
    env.onResult?.(question, result, 900);

    expect(latest.learning.attempts).toHaveLength(1);
    expect(latest.learning.mastery[question.unit]).toMatchObject({ n: 1, value: 0.5 });
    expect(latest.learning.recent).toEqual([question.id]);
    expect(latest.learning.mistakes).toEqual([question.id]);
    expect(latest.learning.playSecondsByDate['2026-10-08']).toBe(60);
    expect(stale.learning.attempts).toHaveLength(0);
  });
});
