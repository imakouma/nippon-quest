import { addProgressValue } from '../../shared/safeInteger';
import type { GameState } from '../state/schema';
import { canonicalUnitId } from './unitAliases';
import { aggregateUnitMastery } from './unitProgress';

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

function normalizeTouchedMarkers(
  markers: GameState['learning']['masteredRewardUnits'],
  canonicalUnit: string,
): { markers: GameState['learning']['masteredRewardUnits']; alreadyMastered: boolean; changed: boolean } {
  let alreadyMastered = false;
  let changed = false;
  const normalized: string[] = [];

  for (const marker of markers) {
    if (canonicalUnitId(marker) !== canonicalUnit) {
      normalized.push(marker);
      continue;
    }
    if (alreadyMastered) {
      changed = true;
      continue;
    }
    alreadyMastered = true;
    normalized.push(canonicalUnit);
    if (marker !== canonicalUnit) changed = true;
  }

  return { markers: changed ? normalized : markers, alreadyMastered, changed };
}

export function applyLearningRewards(prev: GameState, outcome: LearningRewardOutcome): LearningRewardResult {
  const canonicalUnit = canonicalUnitId(outcome.unit);
  const mastery = aggregateUnitMastery(prev.learning.mastery)[canonicalUnit];
  const normalizedMarkers = normalizeTouchedMarkers(prev.learning.masteredRewardUnits, canonicalUnit);
  const mastered = !!mastery && mastery.n >= 3 && mastery.value >= 0.8 && !normalizedMarkers.alreadyMastered;
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

  if (!mastered && !corrected && !normalizedMarkers.changed) return { state: prev, earned: 0, reasons };

  const earned = reasons.length;
  const masteredRewardUnits = mastered
    ? [...normalizedMarkers.markers, canonicalUnit]
    : normalizedMarkers.markers;
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
      dex:
        earned > 0 && !prev.dex.items.includes(LEARNING_FRAGMENT_ID)
          ? { ...prev.dex, items: [...prev.dex.items, LEARNING_FRAGMENT_ID] }
          : prev.dex,
      learning: {
        ...prev.learning,
        masteredRewardUnits,
        correctedRewardQuestionIds,
      },
    },
    earned,
    reasons,
  };
}
