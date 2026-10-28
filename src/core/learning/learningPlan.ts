import { canonicalUnitId } from './unitAliases';
import type { AttemptEvent } from './state';
import {
  rankLearningRecommendations,
  type CompletedLearningPlanReason,
  type LearningPlanItem,
  type LearningRecommendationPolicyInput,
} from './recommendationPolicy';

const DAY_MS = 86_400_000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1_000;
const MAX_PLAN_ITEMS = 3;

export type LearningPlanInput = Omit<LearningRecommendationPolicyInput, 'evaluationNow'> & {
  now: number;
};

export function buildLearningPlan(input: LearningPlanInput): LearningPlanItem[] {
  const evaluationNow = Math.floor((input.now + JST_OFFSET_MS) / DAY_MS) * DAY_MS - JST_OFFSET_MS;
  const completed = completedItems(input, evaluationNow);
  if (completed.length >= MAX_PLAN_ITEMS) return completed;

  const completedQuestionIds = new Set(completed.map((item) => item.questionId));
  const recommendations = rankLearningRecommendations({ ...input, evaluationNow })
    .filter((item) => !completedQuestionIds.has(item.questionId))
    .slice(0, MAX_PLAN_ITEMS - completed.length)
    .map((item): LearningPlanItem => ({
      ...item,
      conceptIds: [...item.conceptIds],
      completed: false,
    }));
  return [...completed, ...recommendations];
}

function completedItems(input: LearningPlanInput, evaluationNow: number): LearningPlanItem[] {
  const upper = evaluationNow + DAY_MS;
  const events = input.attempts
    .filter(
      (event) =>
        event.answeredAt >= evaluationNow && event.answeredAt < upper && isCompletedReason(event.reason),
    )
    .sort(compareAttempts);
  const completed: LearningPlanItem[] = [];
  const seenQuestionIds = new Set<string>();
  for (const event of events) {
    if (seenQuestionIds.has(event.questionId)) continue;
    seenQuestionIds.add(event.questionId);
    const details = completedQuestionDetails(input, event.questionId);
    if (!details) continue;
    completed.push({
      ...details,
      reason: event.reason as CompletedLearningPlanReason,
      completed: true,
    });
    if (completed.length === MAX_PLAN_ITEMS) break;
  }
  return completed;
}

function completedQuestionDetails(
  input: LearningPlanInput,
  questionId: string,
): Pick<LearningPlanItem, 'questionId' | 'actualUnitId' | 'conceptIds'> | undefined {
  const question = input.questionBank.get(questionId);
  if (!question) return undefined;
  const lower = input.gradeScope.includeLower ? 1 : input.gradeScope.grade;
  const upper = input.gradeScope.challengeHigher ? 6 : input.gradeScope.grade;
  if (question.grade < lower || question.grade > upper) return undefined;
  const questionLink = input.graph.questionLinks.find((item) => item.questionId === questionId);
  if (!questionLink) return undefined;
  const conceptsById = new Map(input.graph.concepts.map((item) => [item.id, item]));
  const conceptIds = [
    ...new Set(
      questionLink.concepts
        .filter((mapping) => {
          const item = conceptsById.get(mapping.conceptId);
          return item !== undefined && item.grade >= lower && item.grade <= upper;
        })
        .map((mapping) => mapping.conceptId),
    ),
  ].sort(asciiCompare);
  if (conceptIds.length === 0) return undefined;
  return {
    questionId,
    actualUnitId: canonicalUnitId(question.unit),
    conceptIds,
  };
}

function isCompletedReason(reason: AttemptEvent['reason']): reason is CompletedLearningPlanReason {
  return reason === 'review' || reason === 'diagnosis';
}

function compareAttempts(left: AttemptEvent, right: AttemptEvent): number {
  return (
    left.answeredAt - right.answeredAt ||
    asciiCompare(left.id, right.id) ||
    asciiCompare(left.questionId, right.questionId)
  );
}

function asciiCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
