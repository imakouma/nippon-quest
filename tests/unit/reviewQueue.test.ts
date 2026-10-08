import { describe, expect, it } from 'vitest';
import { curriculumGraph } from '../../src/core/learning';
import { createNewGame } from '../../src/core/state/newGame';
import { innRest } from '../../src/core/progression/town';
import type { QuestionBank } from '../../src/questions/engine';
import { buildReviewQueue, clearReviewedMistake } from '../../src/scenes/overworld/reviewQueue';

const knownIds = new Set(curriculumGraph.questionLinks.map((link) => link.questionId));
const bank = {
  get: (id: string) => (knownIds.has(id) ? { id } : undefined),
} as unknown as QuestionBank;

describe('宿屋の復習キュー', () => {
  it('正解した問題をまちがいから外し、更新時刻を進める', () => {
    const game = createNewGame({ name: 'テスト', grade: 1 }, 100);
    game.learning.mistakes = ['first', 'second'];

    const next = clearReviewedMistake(game, 'first', 200);

    expect(next.learning.mistakes).toEqual(['second']);
    expect(next.updatedAt).toBe(200);
    expect(game.learning.mistakes).toEqual(['first', 'second']);
  });

  it('復習後に宿泊しても、解消したまちがいを戻さない', () => {
    const game = createNewGame({ name: 'テスト', grade: 1 }, 100);
    game.learning.mistakes = ['first'];
    const reviewed = clearReviewedMistake(game, 'first', 200);

    const rested = innRest(reviewed, { hp: 40, mp: 10 }, { map: 'aomori-town', x: 8, y: 8 }, 0, 300);

    expect(rested.state.learning.mistakes).toEqual([]);
    expect(rested.state.updatedAt).toBe(300);
  });

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
