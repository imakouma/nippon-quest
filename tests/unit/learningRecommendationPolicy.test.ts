import { describe, expect, it } from 'vitest';
import type { CurriculumGraph, QuestionConceptLink } from '../../src/core/learning/model';
import {
  rankLearningRecommendations,
  recommendationReasonToAttemptReason,
  type LearningRecommendationPolicyInput,
} from '../../src/core/learning/recommendationPolicy';
import type { Grade, QuestionBase } from '../../src/questions/contracts';
import { QuestionBank } from '../../src/questions/engine/bank';

const question = (id: string, grade: Grade, unit = `sansu.g${grade}.unit`): QuestionBase => ({
  id,
  type: 'choice',
  subject: 'sansu',
  grade,
  unit,
  payload: {},
});

const concept = (id: string, grade: Grade, unit = `sansu.g${grade}.unit`) => ({
  id,
  subject: 'sansu' as const,
  grade,
  unit,
  name: id,
  description: id,
  kind: 'concept' as const,
  memoryType: 'concept' as const,
  curriculumCodes: [],
  sourceIds: ['source'],
  review: { status: 'draft' as const },
});

const link = (
  questionId: string,
  conceptIds: string[],
  options: { diagnosticValue?: number; role?: 'primary' | 'supporting' | 'reading' } = {},
): QuestionConceptLink => ({
  questionId,
  concepts: conceptIds.map((conceptId) => ({
    conceptId,
    role: options.role ?? 'supporting',
    weight: 1,
  })),
  diagnosticValue: options.diagnosticValue ?? 0.5,
  reviewStatus: 'draft',
  misconceptionSignals: [],
});

const graph = (
  concepts: CurriculumGraph['concepts'],
  questionLinks: QuestionConceptLink[],
): CurriculumGraph => ({
  schemaVersion: 1,
  sources: [],
  concepts,
  relations: [],
  questionLinks,
});

const bankWith = (...questions: QuestionBase[]): QuestionBank => {
  const bank = new QuestionBank();
  for (const item of questions) bank.add(item);
  return bank;
};

const input = (
  curriculum: CurriculumGraph,
  questionBank: QuestionBank,
  overrides: Partial<LearningRecommendationPolicyInput> = {},
): LearningRecommendationPolicyInput => ({
  graph: curriculum,
  questionBank,
  conceptStates: {},
  attempts: [],
  recentQuestionIds: [],
  unitMastery: {},
  grandfatheredUnitIds: [],
  gradeScope: { grade: 3, includeLower: false, challengeHigher: false },
  evaluationNow: Date.UTC(2026, 0, 1),
  ...overrides,
});

describe('recommendationReasonToAttemptReason', () => {
  it.each([
    ['due-review', 'review'],
    ['weak-prerequisite', 'diagnosis'],
    ['unseen-primary', 'diagnosis'],
    ['unseen-question', 'diagnosis'],
  ] as const)('%s を %s として記録する', (reason, expected) => {
    expect(recommendationReasonToAttemptReason(reason)).toBe(expected);
  });
});

describe('rankLearningRecommendations eligibility', () => {
  it('includeLower と challengeHigher の学年境界を問題と概念の両方へ適用する', () => {
    const questions = [question('g1', 1), question('g3', 3), question('g6', 6)];
    const concepts = [concept('c1', 1), concept('c3', 3), concept('c6', 6)];
    const curriculum = graph(concepts, [link('g1', ['c1']), link('g3', ['c3']), link('g6', ['c6'])]);
    const bank = bankWith(...questions);

    expect(rankLearningRecommendations(input(curriculum, bank)).map((item) => item.questionId)).toEqual([
      'g3',
    ]);
    expect(
      rankLearningRecommendations(
        input(curriculum, bank, {
          gradeScope: { grade: 3, includeLower: true, challengeHigher: false },
        }),
      ).map((item) => item.questionId),
    ).toEqual(['g1', 'g3']);
    expect(
      rankLearningRecommendations(
        input(curriculum, bank, {
          gradeScope: { grade: 3, includeLower: false, challengeHigher: true },
        }),
      ).map((item) => item.questionId),
    ).toEqual(['g3', 'g6']);
  });

  it('QuestionBank不在、リンク不在、未知概念、概念学年外を候補にしない', () => {
    const valid = question('valid', 3);
    const linkless = question('linkless', 3);
    const conceptOutOfScope = question('concept-out-of-scope', 3);
    const curriculum = graph(
      [concept('valid-concept', 3), concept('higher-concept', 6)],
      [
        link('valid', ['valid-concept']),
        link('missing-bank-question', ['valid-concept']),
        link('unknown-concept-question', ['unknown-concept']),
        link('concept-out-of-scope', ['higher-concept']),
      ],
    );

    const ranked = rankLearningRecommendations(
      input(curriculum, bankWith(valid, linkless, conceptOutOfScope)),
    );

    expect(ranked.map((item) => item.questionId)).toEqual(['valid']);
  });

  it('正規Unitと重複除去したASCII順の概念IDを新しい値で返す', () => {
    const legacyQuestion = question('legacy', 1, 'sansu.g1.legacy-math-1-2');
    const curriculum = graph(
      [concept('concept-b', 1), concept('concept-a', 1)],
      [link('legacy', ['concept-b', 'concept-a', 'concept-b'])],
    );
    const policyInput = input(curriculum, bankWith(legacyQuestion), {
      gradeScope: { grade: 1, includeLower: false, challengeHigher: false },
    });

    const first = rankLearningRecommendations(policyInput);
    const second = rankLearningRecommendations(policyInput);

    expect(first).toEqual([
      {
        questionId: 'legacy',
        actualUnitId: 'sansu.g1.tashizan',
        reason: 'unseen-question',
        conceptIds: ['concept-a', 'concept-b'],
      },
    ]);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second[0]).not.toBe(first[0]);
    expect(second[0]!.conceptIds).not.toBe(first[0]!.conceptIds);
  });
});
