import { describe, expect, it } from 'vitest';
import { unitSchema } from '../../src/core/content/schemas';
import { classifyQuestion, isRequiredCourse } from '../../src/core/learning/placement';
import { validateCurriculumConceptUnits, validateCurriculumUnits } from '../../src/core/learning/validation';
import { buildCurriculumCoverage } from '../../src/core/learning/coverage';

const classifiedUnit = {
  id: 'sansu.g1.kazu-100',
  name: 'かずと すうじ',
  subject: 'sansu',
  grade: 1,
  order: 1,
  courseKind: 'required-subject',
  placement: {
    terms: [1],
    status: 'reference',
    sourceIds: ['tokyo-shoseki-g1-annual-plan'],
    note: '年間[ねんかん]指導[しどう]計画[けいかく]による おすすめ時期[じき]。',
  },
  curriculumCodes: ['8250213111200000'],
  sourceIds: ['mext-82v12'],
  review: {
    status: 'source-checked',
    reviewedAt: '2026-10-08',
    reviewer: 'Codex（一次資料照合）',
  },
} as const;

describe('unitSchema curriculum classification', () => {
  it('accepts a source-backed recommended term', () => {
    expect(unitSchema.parse(classifiedUnit)).toMatchObject(classifiedUnit);
  });

  it('accepts variable placement when annual plans differ', () => {
    expect(
      unitSchema.parse({
        ...classifiedUnit,
        placement: { ...classifiedUnit.placement, terms: ['variable'] },
      }).placement?.terms,
    ).toEqual(['variable']);
  });

  it('keeps unclassified legacy units readable during migration', () => {
    expect(
      unitSchema.parse({
        id: 'kokugo.g1.hiragana',
        name: 'ひらがな',
        subject: 'kokugo',
        grade: 1,
      }),
    ).toMatchObject({ id: 'kokugo.g1.hiragana' });
  });

  it('rejects a recommendation without a source', () => {
    const result = unitSchema.safeParse({
      ...classifiedUnit,
      placement: { ...classifiedUnit.placement, sourceIds: [] },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-82V12 curriculum code', () => {
    const result = unitSchema.safeParse({ ...classifiedUnit, curriculumCodes: ['bad-code'] });
    expect(result.success).toBe(false);
  });
});

describe('official elementary course boundaries', () => {
  it.each([
    [1, 'kokugo', 'required-subject', true],
    [1, 'seikatsu', 'required-subject', true],
    [1, 'eigo', 'supplementary', false],
    [2, 'rika', 'required-subject', false],
    [3, 'rika', 'required-subject', true],
    [3, 'eigo', 'required-activity', true],
    [4, 'seikatsu', 'required-subject', false],
    [5, 'eigo', 'required-subject', true],
    [6, 'shakai', 'required-subject', true],
  ] as const)('%i年 %s / %s => %s', (grade, subject, courseKind, expected) => {
    expect(isRequiredCourse({ grade, subject, courseKind })).toBe(expected);
  });

  it('derives placement from the question unit without changing the question', () => {
    const question = {
      id: 'sansu.g1.kazu-100.0001',
      type: 'choice',
      subject: 'sansu',
      grade: 1,
      unit: classifiedUnit.id,
      payload: {},
    } as const;
    const units = new Map([[classifiedUnit.id, unitSchema.parse(classifiedUnit)]]);

    expect(classifyQuestion(question, units)).toMatchObject({
      courseKind: 'required-subject',
      terms: [1],
    });
    expect('placement' in question).toBe(false);
  });

  it('returns null when the question unit is unknown', () => {
    const question = {
      id: 'sansu.g1.unknown.0001',
      type: 'choice',
      subject: 'sansu',
      grade: 1,
      unit: 'sansu.g1.unknown',
      payload: {},
    } as const;
    expect(classifyQuestion(question, new Map())).toBeNull();
  });
});

describe('curriculum unit validation', () => {
  it('reports a required course placed outside its official grade range', () => {
    const invalid = unitSchema.parse({
      ...classifiedUnit,
      id: 'rika.g1.seibutsu',
      subject: 'rika',
    });
    expect(validateCurriculumUnits([invalid], [])).toContain(
      'rika.g1.seibutsu: 1年 rika は required-subject の正式課程ではありません',
    );
  });

  it('reports a question whose subject or grade differs from its unit', () => {
    const unit = unitSchema.parse(classifiedUnit);
    const questions = [
      {
        id: 'kokugo.g1.test.0001',
        type: 'choice',
        subject: 'kokugo',
        grade: 1,
        unit: unit.id,
        payload: {},
      },
    ];
    expect(validateCurriculumUnits([unit], questions)).toContain(
      'kokugo.g1.test.0001: 問題と単元 sansu.g1.kazu-100 の教科・学年が一致しません',
    );
  });

  it('accepts an unclassified legacy unit during migration', () => {
    const legacy = unitSchema.parse({
      id: 'kokugo.g1.hiragana',
      name: 'ひらがな',
      subject: 'kokugo',
      grade: 1,
    });
    expect(validateCurriculumUnits([legacy], [])).toEqual([]);
  });

  it('reports concepts whose unit is missing or belongs to another subject', () => {
    const unit = unitSchema.parse(classifiedUnit);
    expect(
      validateCurriculumConceptUnits(
        [unit],
        [
          { id: 'concept.missing', subject: 'sansu', grade: 1, unit: 'sansu.g1.missing' },
          { id: 'concept.mismatch', subject: 'kokugo', grade: 1, unit: unit.id },
        ],
      ),
    ).toEqual([
      'concept.missing: 単元 sansu.g1.missing が存在しません',
      'concept.mismatch: 概念と単元 sansu.g1.kazu-100 の教科・学年が一致しません',
    ]);
  });
});

describe('curriculum coverage', () => {
  it('separates linked questions from unreviewed questions by unit', () => {
    const unit = unitSchema.parse(classifiedUnit);
    const report = buildCurriculumCoverage({
      units: [unit],
      questions: [
        { id: 'q1', unit: unit.id },
        { id: 'q2', unit: unit.id },
      ],
      concepts: [{ id: 'c1', unit: unit.id }],
      linkedQuestionIds: new Set(['q1']),
      grade: 1,
      term: 1,
    });
    expect(report.units).toEqual([
      expect.objectContaining({ unitId: unit.id, questions: 2, linked: 1, unreviewed: 1, goals: 1 }),
    ]);
  });

  it('does not claim multi-term unit questions are confirmed for one term', () => {
    const unit = unitSchema.parse({
      ...classifiedUnit,
      placement: { ...classifiedUnit.placement, terms: [1, 2] },
    });
    const report = buildCurriculumCoverage({
      units: [unit],
      questions: [{ id: 'q1', unit: unit.id }],
      concepts: [{ id: 'c1', unit: unit.id }],
      linkedQuestionIds: new Set(['q1']),
      grade: 1,
      term: 1,
    });

    expect(report.units[0]).toMatchObject({
      questions: 1,
      confirmedTermQuestions: 0,
      placementKind: 'spans-terms',
    });
    expect(report.findings).toContainEqual({
      unitId: unit.id,
      kind: 'ambiguous-term-placement',
      severity: 'review',
    });
  });

  it('reports a unit whose questions have no learning-goal links', () => {
    const unit = unitSchema.parse(classifiedUnit);
    const report = buildCurriculumCoverage({
      units: [unit],
      questions: [{ id: 'q1', unit: unit.id }],
      concepts: [{ id: 'c1', unit: unit.id }],
      linkedQuestionIds: new Set(),
      grade: 1,
      term: 1,
    });

    expect(report.findings).toContainEqual({
      unitId: unit.id,
      kind: 'all-questions-unreviewed',
      severity: 'review',
    });
    expect(report.findings).toContainEqual({
      unitId: unit.id,
      kind: 'confirmed-term-unreviewed',
      severity: 'error',
    });
  });

  it('keeps variable-placement units visible without assigning their questions to the term', () => {
    const unit = unitSchema.parse({
      ...classifiedUnit,
      placement: { ...classifiedUnit.placement, terms: ['variable'] },
    });
    const report = buildCurriculumCoverage({
      units: [unit],
      questions: [{ id: 'q1', unit: unit.id }],
      concepts: [{ id: 'c1', unit: unit.id }],
      linkedQuestionIds: new Set(['q1']),
      grade: 1,
      term: 1,
    });

    expect(report.units).toHaveLength(1);
    expect(report.units[0]).toMatchObject({
      confirmedTermQuestions: 0,
      placementKind: 'spans-terms',
    });
  });

  it('derives a term for a multi-term unit from its primary learning goal window', () => {
    const unit = unitSchema.parse({
      ...classifiedUnit,
      placement: { ...classifiedUnit.placement, terms: [1, 2] },
    });
    const report = buildCurriculumCoverage({
      units: [unit],
      questions: [{ id: 'q1', unit: unit.id }],
      concepts: [{ id: 'c1', unit: unit.id, recommendedWindow: { stage: 'early' } }],
      linkedQuestionIds: new Set(['q1']),
      questionConceptLinks: [{ questionId: 'q1', concepts: [{ conceptId: 'c1', role: 'primary' }] }],
      grade: 1,
      term: 1,
    });

    expect(report.units[0]).toMatchObject({
      confirmedTermQuestions: 1,
      confirmedTermUnreviewed: 0,
      placementKind: 'spans-terms',
    });
  });

  it('reports an early learning goal with fewer than three primary questions', () => {
    const unit = unitSchema.parse(classifiedUnit);
    const report = buildCurriculumCoverage({
      units: [unit],
      questions: [{ id: 'q1', unit: unit.id }],
      concepts: [{ id: 'c1', unit: unit.id, recommendedWindow: { stage: 'early' } }],
      linkedQuestionIds: new Set(['q1']),
      questionConceptLinks: [{ questionId: 'q1', concepts: [{ conceptId: 'c1', role: 'primary' }] }],
      grade: 1,
      term: 1,
    });

    expect(report.findings).toContainEqual({
      unitId: unit.id,
      conceptId: 'c1',
      kind: 'sparse-learning-goal',
      severity: 'review',
    });
  });
});
