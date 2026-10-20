import { addProgressValue } from '../../shared/safeInteger';
import type { GameState } from '../state/schema';

export const LEARNING_FRAGMENT_ID = 'learning-fragment';

export interface LearningRewardOutcome {
  questionId: string;
  unit: string;
  score: number;
  wasMistakeBeforeAnswer: boolean;
}

export type LearningRewardReason = 'mastery' | 'correction';

export interface LearningRewardResult {
  state: GameState;
  earned: number;
  reasons: LearningRewardReason[];
}

export function applyLearningRewards(prev: GameState, outcome: LearningRewardOutcome): LearningRewardResult {
  const mastery = prev.learning.mastery[outcome.unit];
  const mastered =
    !!mastery &&
    mastery.n >= 3 &&
    mastery.value >= 0.8 &&
    !prev.learning.masteredRewardUnits.includes(outcome.unit);
  const corrected =
    outcome.score === 1 &&
    outcome.wasMistakeBeforeAnswer &&
    !prev.learning.correctedRewardQuestionIds.includes(outcome.questionId);
  const correctedRewardQuestionIds = corrected
    ? [...prev.learning.correctedRewardQuestionIds, outcome.questionId]
    : prev.learning.correctedRewardQuestionIds;
  const correctionReward =
    Math.floor(correctedRewardQuestionIds.length / 3) >
    Math.floor(prev.learning.correctedRewardQuestionIds.length / 3);
  const reasons: LearningRewardReason[] = [
    ...(mastered ? (['mastery'] as const) : []),
    ...(correctionReward ? (['correction'] as const) : []),
  ];

  if (!mastered && !corrected) return { state: prev, earned: 0, reasons };
  const earned = reasons.length;
  return {
    state: {
      ...prev,
      inventory:
        earned > 0
          ? {
              ...prev.inventory,
              [LEARNING_FRAGMENT_ID]: addProgressValue(prev.inventory[LEARNING_FRAGMENT_ID] ?? 0, earned),
            }
          : prev.inventory,
      learning: {
        ...prev.learning,
        masteredRewardUnits: mastered
          ? [...prev.learning.masteredRewardUnits, outcome.unit]
          : prev.learning.masteredRewardUnits,
        correctedRewardQuestionIds,
      },
    },
    earned,
    reasons,
  };
}
