import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import type { CurriculumGraph } from '../../src/core/learning';
import { buildCurriculumGraphQuality } from '../../src/core/learning';

const unit = (id: string, grade: Unit['grade'], subject: Unit['subject'] = 'sansu'): Unit => ({
  id,
  name: id,
  subject,
  grade,
  courseKind: subject === 'eigo' && grade < 5 ? 'required-activity' : 'required-subject',
});

const units = [
  unit('sansu.g1.base', 1),
  unit('sansu.g1.add', 1),
  unit('sansu.g1.subtract', 1),
  unit('sansu.g1.apply', 1),
  unit('sansu.g2.isolated', 2),
  unit('kokugo.g2.read', 2, 'kokugo'),
];

const graph: CurriculumGraph = {
  schemaVersion: 1,
  sources: [
    {
      id: 'source',
      title: 'source',
      publisher: 'source',
      url: 'https://example.com',
      published: '2026',
      checkedAt: '2026-10-23',
      locator: 'test',
    },
  ],
  concepts: units.map((item) => ({
    id: `${item.id}.concept`,
    subject: item.subject,
    grade: item.grade,
    unit: item.id,
    name: item.name,
    description: item.name,
    kind: 'concept',
    memoryType: 'concept',
    curriculumCodes: [],
    sourceIds: ['source'],
    review: { status: 'draft' },
  })),
  relations: [
    ['sansu.g1.base', 'sansu.g1.add'],
    ['sansu.g1.base', 'sansu.g1.subtract'],
    ['sansu.g1.add', 'sansu.g1.apply'],
    ['sansu.g1.subtract', 'sansu.g1.apply'],
  ].map(([from, to]) => ({
    from: `${from}.concept`,
    to: `${to}.concept`,
    kind: 'prerequisite' as const,
    strength: 1,
    rationale: 'test',
    sourceIds: ['source'],
    reviewStatus: 'source-checked' as const,
  })),
  questionLinks: [],
};

describe('curriculum graph quality', () => {
  it('単元レベルの分岐、合流、孤立を教科別に数える', () => {
    const report = buildCurriculumGraphQuality({ units, graph });

    expect(report.bySubject.sansu).toMatchObject({
      units: 5,
      edges: 4,
      hardEdges: 4,
      branches: 1,
      merges: 1,
      hardMerges: 1,
      isolated: ['sansu.g2.isolated'],
    });
    expect(report.bySubject.kokugo?.isolated).toEqual(['kokugo.g2.read']);
  });

  it('逆学年、教科横断、単元循環、重複関係を検出する', () => {
    const broken = structuredClone(graph);
    broken.relations.push(
      structuredClone(broken.relations[0]!),
      {
        from: 'sansu.g1.apply.concept',
        to: 'sansu.g1.base.concept',
        kind: 'prerequisite',
        strength: 1,
        rationale: 'cycle',
        sourceIds: ['source'],
        reviewStatus: 'draft',
      },
      {
        from: 'kokugo.g2.read.concept',
        to: 'sansu.g1.apply.concept',
        kind: 'prerequisite',
        strength: 1,
        rationale: 'cross subject and reverse grade',
        sourceIds: ['source'],
        reviewStatus: 'draft',
      },
    );

    const report = buildCurriculumGraphQuality({ units, graph: broken });

    expect(report.duplicateRelations).toHaveLength(1);
    expect(report.crossSubjectEdges).toHaveLength(1);
    expect(report.reverseGradeEdges).toHaveLength(1);
    expect(report.unitCycles.length).toBeGreaterThan(0);
    expect(report.unreviewedPrerequisites).toBe(2);
  });

  it('非ロック関係も表示上の接続として数える', () => {
    const connected = structuredClone(graph);
    connected.relations.push({
      from: 'sansu.g1.apply.concept',
      to: 'sansu.g2.isolated.concept',
      kind: 'transfer',
      strength: 0.7,
      rationale: '学年間の転移',
      sourceIds: ['source'],
      reviewStatus: 'source-checked',
    });

    const report = buildCurriculumGraphQuality({ units, graph: connected });

    expect(report.bySubject.sansu).toMatchObject({ edges: 5, hardEdges: 4, isolated: [] });
    expect(report.prerequisiteEdges).toHaveLength(4);
  });
});
