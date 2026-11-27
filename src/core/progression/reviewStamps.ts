import type { GameState } from '../state/schema';
import { addProgressValue } from '../../shared/safeInteger';

export const REVIEW_CARD_SIZE = 12;
export const reviewStampRewards = [
  { count: 3, itemId: 'akita-ogata-okome', quantity: 1 },
  { count: 6, itemId: 'niigata-uonuma-okome', quantity: 1 },
  { count: 12, itemId: 'learning-fragment', quantity: 1 },
] as const;
export const reviewCardExchangeRewards = [
  { cards: 1, itemId: 'akita-ogata-okome', quantity: 3 },
  { cards: 3, itemId: 'learning-fragment', quantity: 1 },
  { cards: 5, itemId: 'learning-fragment', quantity: 2 },
] as const;

export type ReviewStamp = NonNullable<GameState['learning']['reviewStamps']>[number];

export function availableReviewCards(learning: GameState['learning']): number {
  return Math.max(
    0,
    Math.floor((learning.reviewStamps?.length ?? 0) / REVIEW_CARD_SIZE) - (learning.redeemedReviewCards ?? 0),
  );
}

export function pressReviewStamp(game: GameState, stamp: ReviewStamp): GameState {
  const pending = game.learning.pendingReviewStamps;
  if (!pending?.includes(stamp.questionId)) return game;
  const stamps = game.learning.reviewStamps ?? [];
  if (stamps.some((entry) => entry.questionId === stamp.questionId)) return game;
  const earned = reviewStampRewards.find((reward) => reward.count === (stamps.length % REVIEW_CARD_SIZE) + 1);
  return {
    ...game,
    updatedAt: stamp.at,
    learning: {
      ...game.learning,
      reviewStamps: [...stamps, stamp],
      pendingReviewStamps: pending.filter((id) => id !== stamp.questionId),
    },
    ...(earned
      ? {
          inventory: {
            ...game.inventory,
            [earned.itemId]: addProgressValue(game.inventory[earned.itemId] ?? 0, earned.quantity),
          },
          dex: {
            ...game.dex,
            items: [...new Set([...game.dex.items, earned.itemId])],
          },
        }
      : {}),
  };
}
