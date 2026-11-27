import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { gameStateSchema } from '../../src/core/state/schema';
import {
  availableReviewCards,
  pressReviewStamp,
  reviewStampRewards,
} from '../../src/core/progression/reviewStamps';

describe('review stamps', () => {
  it('persists the stamp and milestone reward once and starts a second card', () => {
    let game = createNewGame({ name: 'test', grade: 3 }, 100);
    expect(gameStateSchema.parse(game).learning.reviewStamps).toBeUndefined();
    for (let i = 1; i <= 13; i++) {
      const questionId = 'question-' + i;
      game.learning.pendingReviewStamps = [questionId];
      const stamp = { questionId, at: 100 + i, x: 0.08, y: -0.04, seed: 45 };
      game = pressReviewStamp(game, stamp);
      expect(pressReviewStamp(game, stamp)).toBe(game);
    }
    const saved = gameStateSchema.parse(JSON.parse(JSON.stringify(game)));
    expect(saved.learning.reviewStamps).toHaveLength(13);
    expect(saved.learning.reviewStamps?.[0]).toMatchObject({ x: 0.08, y: -0.04, seed: 45 });
    expect(availableReviewCards(saved.learning)).toBe(1);
    for (const reward of reviewStampRewards) expect(saved.inventory[reward.itemId]).toBe(1);
    saved.learning.redeemedReviewCards = 1;
    expect(availableReviewCards(saved.learning)).toBe(0);
  });
});
