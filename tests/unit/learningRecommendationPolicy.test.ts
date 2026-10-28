import { describe, expect, it } from 'vitest';
import type { CurriculumGraph, QuestionConceptLink } from '../../src/core/learning/model';
import type { ConceptState } from '../../src/core/learning/state';
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

const conceptState = (overrides: Partial<ConceptState> = {}): ConceptState => ({
  understanding: 0.5,
  retention: 0.8,
  confidence: 0.5,
  attempts: 1,
  independentSuccesses: 0,
  streak: 0,
  lastSeenAt: Date.UTC(2026, 0, 1),
  lastSuccessAt: null,
  lastFailureAt: null,
  dueAt: Date.UTC(2026, 0, 2),
  intervalDays: 1,
  ...overrides,
});

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

describe('rankLearningRecommendations due review', () => {
  it('期限、試行数、定着率0.65の境界を満たす概念だけを期限到来にする', () => {
    const now = Date.UTC(2026, 0, 8);
    const ids = ['due', 'cutoff', 'zero-attempts', 'future'];
    const curriculum = graph(
      ids.map((id) => concept(id, 3)),
      ids.map((id) => link(`${id}-question`, [id])),
    );
    const bank = bankWith(...ids.map((id) => question(`${id}-question`, 3)));

    const ranked = rankLearningRecommendations(
      input(curriculum, bank, {
        evaluationNow: now,
        conceptStates: {
          due: conceptState({ retention: 0.64, lastSeenAt: now, dueAt: now }),
          cutoff: conceptState({ retention: 0.65, lastSeenAt: now, dueAt: now }),
          'zero-attempts': conceptState({
            retention: 0.1,
            attempts: 0,
            lastSeenAt: now,
            dueAt: now,
          }),
          future: conceptState({ retention: 0.1, lastSeenAt: now, dueAt: now + 1 }),
        },
      }),
    );

    expect(ranked.find((item) => item.questionId === 'due-question')?.reason).toBe('due-review');
    for (const questionId of ['cutoff-question', 'zero-attempts-question', 'future-question']) {
      expect(ranked.find((item) => item.questionId === questionId)?.reason).toBe('unseen-question');
    }
  });

  it('重み付きneedと7日上限の期限超過を合計して降順にする', () => {
    const now = Date.UTC(2026, 0, 20);
    const day = 86_400_000;
    const curriculum = graph(
      [concept('overdue-a', 3), concept('overdue-b', 3), concept('today', 3)],
      [
        {
          ...link('overdue-question', ['overdue-a', 'overdue-b']),
          concepts: [
            { conceptId: 'overdue-a', role: 'supporting', weight: 1 },
            { conceptId: 'overdue-b', role: 'supporting', weight: 0.5 },
          ],
        },
        link('today-question', ['today']),
      ],
    );
    const bank = bankWith(question('overdue-question', 3), question('today-question', 3));

    const ranked = rankLearningRecommendations(
      input(curriculum, bank, {
        evaluationNow: now,
        conceptStates: {
          'overdue-a': conceptState({ retention: 0.5, lastSeenAt: now, dueAt: now - 20 * day }),
          'overdue-b': conceptState({ retention: 0.5, lastSeenAt: now, dueAt: now - 7 * day }),
          today: conceptState({ retention: 0.1, lastSeenAt: now, dueAt: now }),
        },
      }),
    );

    expect(ranked.slice(0, 2).map(({ questionId, reason }) => ({ questionId, reason }))).toEqual([
      { questionId: 'overdue-question', reason: 'due-review' },
      { questionId: 'today-question', reason: 'due-review' },
    ]);
  });
});

describe('rankLearningRecommendations weak prerequisites', () => {
  it('未修得primary目標の直接前提をweakness降順で返し、実際の問題Unitを使う', () => {
    const curriculum: CurriculumGraph = {
      ...graph(
        [
          concept('target', 3, 'sansu.g3.target'),
          concept('weak', 3, 'sansu.g3.weak'),
          concept('less-weak', 3, 'sansu.g3.less-weak'),
        ],
        [
          link('target-question', ['target'], { role: 'primary' }),
          link('weak-question', ['weak'], { role: 'primary' }),
          link('less-weak-question', ['less-weak'], { role: 'primary' }),
        ],
      ),
      relations: [
        {
          from: 'weak',
          to: 'target',
          kind: 'prerequisite',
          strength: 1,
          rationale: 'direct',
          sourceIds: [],
          reviewStatus: 'draft',
        },
        {
          from: 'less-weak',
          to: 'target',
          kind: 'prerequisite',
          strength: 1,
          rationale: 'direct',
          sourceIds: [],
          reviewStatus: 'draft',
        },
      ],
    };
    const bank = bankWith(
      question('target-question', 3, 'sansu.g3.target'),
      question('weak-question', 3, 'sansu.g3.weak'),
      question('less-weak-question', 3, 'sansu.g3.less-weak'),
    );

    const ranked = rankLearningRecommendations(
      input(curriculum, bank, {
        conceptStates: {
          weak: conceptState({ understanding: 0.1, confidence: 0.5 }),
          'less-weak': conceptState({ understanding: 0.5, confidence: 0.5 }),
        },
      }),
    );

    expect(ranked.slice(0, 2)).toMatchObject([
      {
        questionId: 'weak-question',
        actualUnitId: 'sansu.g3.weak',
        reason: 'weak-prerequisite',
      },
      {
        questionId: 'less-weak-question',
        actualUnitId: 'sansu.g3.less-weak',
        reason: 'weak-prerequisite',
      },
    ]);
  });

  it('概念証拠が不完全なら高いUnit習熟値だけでは前提を修得済みにしない', () => {
    const curriculum: CurriculumGraph = {
      ...graph(
        [
          concept('target', 1, 'sansu.g1.target'),
          concept('pre-a', 1, 'sansu.g1.tashizan'),
          concept('pre-b', 1, 'sansu.g1.tashizan'),
        ],
        [
          link('target-question', ['target'], { role: 'primary' }),
          link('pre-question', ['pre-a'], { role: 'primary' }),
        ],
      ),
      relations: [
        {
          from: 'pre-a',
          to: 'target',
          kind: 'prerequisite',
          strength: 1,
          rationale: 'direct',
          sourceIds: [],
          reviewStatus: 'draft',
        },
      ],
    };
    const bank = bankWith(
      question('target-question', 1, 'sansu.g1.target'),
      question('pre-question', 1, 'sansu.g1.legacy-math-1-2'),
    );
    const base = input(curriculum, bank, {
      gradeScope: { grade: 1, includeLower: false, challengeHigher: false },
      conceptStates: { 'pre-a': conceptState() },
      unitMastery: { 'sansu.g1.tashizan': { value: 0.9, n: 4, lastAt: 1 } },
    });

    expect(rankLearningRecommendations(base).find((item) => item.questionId === 'pre-question')?.reason).toBe(
      'weak-prerequisite',
    );
  });

  it('完全な概念証拠と集約習熟、独力成功、既得進捗を同じ修得済み境界として扱う', () => {
    const curriculum: CurriculumGraph = {
      ...graph(
        [
          concept('target', 1, 'sansu.g1.target'),
          concept('pre-a', 1, 'sansu.g1.tashizan'),
          concept('pre-b', 1, 'sansu.g1.tashizan'),
        ],
        [
          link('target-question', ['target'], { role: 'primary' }),
          link('pre-question', ['pre-a'], { role: 'primary' }),
        ],
      ),
      relations: [
        {
          from: 'pre-a',
          to: 'target',
          kind: 'prerequisite',
          strength: 1,
          rationale: 'direct',
          sourceIds: [],
          reviewStatus: 'draft',
        },
      ],
    };
    const bank = bankWith(
      question('target-question', 1, 'sansu.g1.target'),
      question('pre-question', 1, 'sansu.g1.legacy-math-1-2'),
    );
    const completeStates = { 'pre-a': conceptState(), 'pre-b': conceptState() };
    const masteryInputs = [
      { 'sansu.g1.tashizan': { value: 0.9, n: 4, lastAt: 1 } },
      { 'sansu.g1.legacy-math-1-2': { value: 0.9, n: 4, lastAt: 1 } },
      {
        'sansu.g1.tashizan': { value: 0.9, n: 2, lastAt: 1 },
        math_1_2: { value: 0.9, n: 2, lastAt: 2 },
      },
    ];

    for (const unitMastery of masteryInputs) {
      const ranked = rankLearningRecommendations(
        input(curriculum, bank, {
          gradeScope: { grade: 1, includeLower: false, challengeHigher: false },
          conceptStates: completeStates,
          unitMastery,
        }),
      );
      expect(ranked.find((item) => item.questionId === 'pre-question')?.reason).toBe('unseen-question');
    }

    const independent = rankLearningRecommendations(
      input(curriculum, bank, {
        gradeScope: { grade: 1, includeLower: false, challengeHigher: false },
        conceptStates: {
          'pre-a': conceptState({ independentSuccesses: 2 }),
          'pre-b': conceptState({ independentSuccesses: 2 }),
        },
      }),
    );
    expect(independent.find((item) => item.questionId === 'pre-question')?.reason).toBe('unseen-question');

    const grandfathered = rankLearningRecommendations(
      input(curriculum, bank, {
        gradeScope: { grade: 1, includeLower: false, challengeHigher: false },
        grandfatheredUnitIds: ['math_1_2'],
      }),
    );
    expect(grandfathered.find((item) => item.questionId === 'pre-question')?.reason).not.toBe(
      'weak-prerequisite',
    );
  });
});
