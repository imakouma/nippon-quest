import { describe, expect, it } from 'vitest';
import { curriculumGraph } from '../../src/core/learning';
import { createNewGame } from '../../src/core/state/newGame';
import type { QuestionBank } from '../../src/questions/engine';
import { buildReviewQueue } from '../../src/scenes/overworld/reviewQueue';

const knownIds = new Set(curriculumGraph.questionLinks.map((link) => link.questionId));
const bank = {
  get: (id: string) => (knownIds.has(id) ? { id } : undefined),
} as unknown as QuestionBank;

describe('宿屋の復習キュー', () => {
  it('直近の誤答の後に、原因を切り分ける別問題を入れる', () => {
    const game = createNewGame({ name: 'テスト', grade: 1 });
    game.learning.mistakes = ['sansu.g1.tashizan.0002'];
    game.learning.attempts.push({
      id: 'attempt-1',
      profileId: 'local',
      questionId: 'sansu.g1.tashizan.0002',
      presentedAt: 1,
      answeredAt: 2,
      firstAnswer: 'b',
      finalAnswer: 'b',
      score: 0,
      timeMs: 1,
      attempts: 1,
      hintsUsed: 0,
      timedOut: false,
      reason: 'battle',
      appVersion: 'test',
    });

    const queue = buildReviewQueue(game, bank, 2);
    expect(queue[0]).toBe('sansu.g1.tashizan.0002');
    expect(queue[1]).toBeTruthy();
    expect(queue[1]).not.toBe(queue[0]);
  });

  it('問題バンクに無い候補を出さない', () => {
    const game = createNewGame({ name: 'テスト', grade: 1 });
    game.learning.mistakes = ['missing'];
    expect(buildReviewQueue(game, bank, 2)).toEqual([]);
  });
});
