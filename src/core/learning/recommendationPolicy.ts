import type { Grade } from '../../questions/contracts';
import type { QuestionBank } from '../../questions/engine/bank';
import { canonicalUnitId } from './unitAliases';
import type { CurriculumGraph, QuestionConceptLink } from './model';
import { estimatedRetention, type AttemptEvent, type ConceptStateData } from './state';
import { aggregateUnitMastery, type UnitMasteryRecord } from './unitProgress';

export type LearningRecommendationReason =
  'due-review' | 'weak-prerequisite' | 'unseen-primary' | 'unseen-question';

export type CompletedLearningPlanReason = 'review' | 'diagnosis';

export interface LearningRecommendation {
  questionId: string;
  actualUnitId: string;
  reason: LearningRecommendationReason;
  conceptIds: string[];
}

export type LearningPlanItem =
  | (LearningRecommendation & { completed: false })
  | {
      questionId: string;
      actualUnitId: string;
      reason: CompletedLearningPlanReason;
      conceptIds: string[];
      completed: true;
    };

export interface LearningGradeScope {
  grade: Grade;
  includeLower: boolean;
  challengeHigher: boolean;
}

export interface LearningRecommendationPolicyInput {
  graph: CurriculumGraph;
  questionBank: Pick<QuestionBank, 'get' | 'all'>;
  conceptStates: Readonly<ConceptStateData>;
  attempts: readonly AttemptEvent[];
  recentQuestionIds: readonly string[];
  unitMastery: Readonly<Record<string, Readonly<UnitMasteryRecord>>>;
  grandfatheredUnitIds: readonly string[];
  gradeScope: LearningGradeScope;
  evaluationNow: number;
}

interface EligibleQuestion {
  questionId: string;
  actualUnitId: string;
  conceptIds: string[];
  conceptLinks: QuestionConceptLink['concepts'];
  diagnosticValue: number;
}

interface RankedCandidate extends EligibleQuestion {
  category: number;
  priority: number;
  reason: LearningRecommendationReason;
}

const DAY_MS = 86_400_000;

export function recommendationReasonToAttemptReason(
  reason: LearningRecommendationReason,
): CompletedLearningPlanReason {
  return reason === 'due-review' ? 'review' : 'diagnosis';
}

export function rankLearningRecommendations(
  input: LearningRecommendationPolicyInput,
): LearningRecommendation[] {
  const eligible = eligibleQuestions(input);
  const isUnitMastered = unitMasteryChecker(input);
  const weakPriorities = weakPrerequisitePriorities(input, eligible, isUnitMastered);
  const attemptedQuestionIds = new Set(input.attempts.map((attempt) => attempt.questionId));
  const ranked = eligible
    .map((candidate): RankedCandidate | undefined => {
      const duePriority = dueReviewPriority(candidate, input);
      if (duePriority > 0) {
        return { ...candidate, category: 0, priority: duePriority, reason: 'due-review' };
      }
      const weakPriority = weakPriorities.get(candidate.questionId);
      if (weakPriority !== undefined) {
        return {
          ...candidate,
          category: 1,
          priority: weakPriority,
          reason: 'weak-prerequisite',
        };
      }
      const hasUnseenPrimary = candidate.conceptLinks.some(
        (mapping) =>
          mapping.role === 'primary' &&
          (input.conceptStates[mapping.conceptId] === undefined ||
            input.conceptStates[mapping.conceptId]?.attempts === 0),
      );
      if (hasUnseenPrimary) {
        return { ...candidate, category: 2, priority: 0, reason: 'unseen-primary' };
      }
      if (!attemptedQuestionIds.has(candidate.questionId)) {
        return { ...candidate, category: 3, priority: 0, reason: 'unseen-question' };
      }
      return undefined;
    })
    .filter((candidate): candidate is RankedCandidate => candidate !== undefined)
    .sort(compareCandidates);
  const recentQuestionIds = new Set(input.recentQuestionIds);
  const fresh = ranked.filter((candidate) => !recentQuestionIds.has(candidate.questionId));
  const reusable = ranked.filter((candidate) => recentQuestionIds.has(candidate.questionId));
  return [...fresh, ...reusable].map((candidate) => ({
    questionId: candidate.questionId,
    actualUnitId: candidate.actualUnitId,
    reason: candidate.reason,
    conceptIds: [...candidate.conceptIds],
  }));
}

function eligibleQuestions(input: LearningRecommendationPolicyInput): EligibleQuestion[] {
  const lower = input.gradeScope.includeLower ? 1 : input.gradeScope.grade;
  const upper = input.gradeScope.challengeHigher ? 6 : input.gradeScope.grade;
  const conceptsById = new Map(input.graph.concepts.map((item) => [item.id, item]));
  const linksByQuestionId = new Map<string, QuestionConceptLink>();
  for (const item of input.graph.questionLinks) {
    if (!linksByQuestionId.has(item.questionId)) linksByQuestionId.set(item.questionId, item);
  }

  const result: EligibleQuestion[] = [];
  for (const question of input.questionBank.all()) {
    if (question.grade < lower || question.grade > upper) continue;
    const questionLink = linksByQuestionId.get(question.id);
    if (!questionLink || input.questionBank.get(question.id) === undefined) continue;
    const conceptLinks = questionLink.concepts.filter((mapping) => {
      const item = conceptsById.get(mapping.conceptId);
      return item !== undefined && item.grade >= lower && item.grade <= upper;
    });
    const conceptIds = [...new Set(conceptLinks.map((mapping) => mapping.conceptId))].sort(asciiCompare);
    if (conceptIds.length === 0) continue;
    result.push({
      questionId: question.id,
      actualUnitId: canonicalUnitId(question.unit),
      conceptIds,
      conceptLinks: conceptLinks.map((mapping) => ({ ...mapping })),
      diagnosticValue: questionLink.diagnosticValue,
    });
  }
  return result;
}

function dueReviewPriority(candidate: EligibleQuestion, input: LearningRecommendationPolicyInput): number {
  let priority = 0;
  for (const mapping of candidate.conceptLinks) {
    const state = input.conceptStates[mapping.conceptId];
    if (!state || state.attempts === 0 || state.dueAt > input.evaluationNow) continue;
    const retention = estimatedRetention(state, input.evaluationNow);
    if (retention >= 0.65) continue;
    const overdueDays = Math.max(0, input.evaluationNow - state.dueAt) / DAY_MS;
    priority += mapping.weight * (1 - retention) * (1 + Math.min(7, overdueDays) / 7);
  }
  return priority;
}

function weakPrerequisitePriorities(
  input: LearningRecommendationPolicyInput,
  eligible: readonly EligibleQuestion[],
  isUnitMastered: (unitId: string) => boolean,
): Map<string, number> {
  const conceptsById = new Map(input.graph.concepts.map((item) => [item.id, item]));
  const eligiblePrimaryTargets = new Set(
    eligible.flatMap((candidate) =>
      candidate.conceptLinks
        .filter((mapping) => mapping.role === 'primary')
        .map((mapping) => mapping.conceptId),
    ),
  );
  const primaryQuestionsByConcept = new Map<string, EligibleQuestion[]>();
  for (const candidate of eligible) {
    for (const mapping of candidate.conceptLinks) {
      if (mapping.role !== 'primary') continue;
      const questions = primaryQuestionsByConcept.get(mapping.conceptId) ?? [];
      questions.push(candidate);
      primaryQuestionsByConcept.set(mapping.conceptId, questions);
    }
  }

  const priorities = new Map<string, number>();
  for (const relation of input.graph.relations) {
    if (relation.kind !== 'prerequisite' || !eligiblePrimaryTargets.has(relation.to)) continue;
    const target = conceptsById.get(relation.to);
    const prerequisite = conceptsById.get(relation.from);
    if (!target || !prerequisite || isUnitMastered(target.unit) || isUnitMastered(prerequisite.unit))
      continue;
    const state = input.conceptStates[prerequisite.id];
    const weakness = 1 - (state?.understanding ?? 0) * (state?.confidence ?? 0);
    for (const candidate of primaryQuestionsByConcept.get(prerequisite.id) ?? []) {
      priorities.set(candidate.questionId, Math.max(priorities.get(candidate.questionId) ?? 0, weakness));
    }
  }
  return priorities;
}

function unitMasteryChecker(input: LearningRecommendationPolicyInput): (unitId: string) => boolean {
  const aggregate = aggregateUnitMastery(input.unitMastery);
  const grandfathered = new Set(input.grandfatheredUnitIds.map(canonicalUnitId));
  const conceptIdsByUnit = new Map<string, string[]>();
  for (const item of input.graph.concepts) {
    if (item.kind === 'misconception') continue;
    const unitId = canonicalUnitId(item.unit);
    const ids = conceptIdsByUnit.get(unitId) ?? [];
    ids.push(item.id);
    conceptIdsByUnit.set(unitId, ids);
  }

  return (unitId: string): boolean => {
    const canonicalId = canonicalUnitId(unitId);
    if (grandfathered.has(canonicalId)) return true;
    const conceptIds = conceptIdsByUnit.get(canonicalId) ?? [];
    if (conceptIds.length === 0) return false;
    const states = conceptIds.map((id) => input.conceptStates[id]);
    if (states.some((state) => state === undefined)) return false;
    const record = aggregate[canonicalId];
    return (
      (record !== undefined && record.value >= 0.8 && record.n >= 3) ||
      states.every((state) => state!.independentSuccesses >= 2)
    );
  };
}

function compareCandidates(left: RankedCandidate, right: RankedCandidate): number {
  return (
    left.category - right.category ||
    right.priority - left.priority ||
    right.diagnosticValue - left.diagnosticValue ||
    asciiCompare(left.questionId, right.questionId)
  );
}

function asciiCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
