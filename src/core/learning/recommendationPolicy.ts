import type { Grade } from '../../questions/contracts';
import type { QuestionBank } from '../../questions/engine/bank';
import { canonicalUnitId } from './unitAliases';
import type { CurriculumGraph, QuestionConceptLink } from './model';
import type { AttemptEvent, ConceptStateData } from './state';
import type { UnitMasteryRecord } from './unitProgress';

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
  diagnosticValue: number;
}

export function recommendationReasonToAttemptReason(
  reason: LearningRecommendationReason,
): CompletedLearningPlanReason {
  return reason === 'due-review' ? 'review' : 'diagnosis';
}

export function rankLearningRecommendations(
  input: LearningRecommendationPolicyInput,
): LearningRecommendation[] {
  const eligible = eligibleQuestions(input).sort(
    (left, right) =>
      right.diagnosticValue - left.diagnosticValue || asciiCompare(left.questionId, right.questionId),
  );
  return eligible.map((candidate) => ({
    questionId: candidate.questionId,
    actualUnitId: candidate.actualUnitId,
    reason: 'unseen-question',
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
    const conceptIds = [
      ...new Set(
        questionLink.concepts
          .map((mapping) => conceptsById.get(mapping.conceptId))
          .filter((item) => item !== undefined && item.grade >= lower && item.grade <= upper)
          .map((item) => item.id),
      ),
    ].sort(asciiCompare);
    if (conceptIds.length === 0) continue;
    result.push({
      questionId: question.id,
      actualUnitId: canonicalUnitId(question.unit),
      conceptIds,
      diagnosticValue: questionLink.diagnosticValue,
    });
  }
  return result;
}

function asciiCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
