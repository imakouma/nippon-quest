import { describe, expect, it } from 'vitest';
import type { Concept, ConceptRelation } from '../../src/core/learning/model';
import { projectRoadmapRelations } from '../../src/core/learning/roadmapRelations';

function concept(id: string, unit: string, kind: Concept['kind'] = 'concept'): Concept {
  return {
    id,
    subject: 'sansu',
    grade: 1,
    unit,
    name: id,
    description: id,
    kind,
    memoryType: 'concept',
    curriculumCodes: [],
    sourceIds: ['source.test'],
    review: { status: 'draft' },
  };
}

function relation(
  from: string,
  to: string,
  kind: ConceptRelation['kind'] = 'prerequisite',
): ConceptRelation {
  return {
    from,
    to,
    kind,
    strength: 1,
    rationale: `${from} -> ${to}`,
    sourceIds: [],
    reviewStatus: 'draft',
  };
}

describe('projectRoadmapRelations', () => {
  it('current・legacy question・raw legacy の単元IDを同じ前提辺へ正規化する', () => {
    const graph = {
      concepts: [
        concept('source.current', 'sansu.g1.tashizan'),
        concept('source.legacy-question', 'sansu.g1.legacy-math-1-2'),
        concept('source.raw-legacy', 'math_1_2'),
        concept('target', 'sansu.g1.hikizan'),
      ],
      relations: [
        relation('source.current', 'target'),
        relation('source.legacy-question', 'target'),
        relation('source.raw-legacy', 'target'),
      ],
    };

    const projected = projectRoadmapRelations(
      graph,
      new Set(['sansu.g1.tashizan', 'sansu.g1.hikizan']),
    );

    expect([...projected.prerequisiteIdsByTarget]).toEqual([
      ['sansu.g1.hikizan', ['sansu.g1.tashizan']],
    ]);
    expect([...projected.supportingLinksByTarget]).toEqual([]);
  });

  it('missing・misconception・unresolved・same-unit・unsupported の候補を除外する', () => {
    const graph = {
      concepts: [
        concept('valid.source', 'unit.a'),
        concept('valid.target', 'unit.b'),
        concept('misconception', 'unit.c', 'misconception'),
        concept('unresolved', 'unit.not-displayed'),
        concept('same.one', 'unit.same'),
        concept('same.two', 'unit.same'),
      ],
      relations: [
        relation('missing', 'valid.target'),
        relation('misconception', 'valid.target'),
        relation('unresolved', 'valid.target'),
        relation('same.one', 'same.two'),
        relation('valid.source', 'valid.target', 'causal'),
      ],
    };

    const projected = projectRoadmapRelations(
      graph,
      new Set(['unit.a', 'unit.b', 'unit.c', 'unit.same']),
    );

    expect([...projected.prerequisiteIdsByTarget]).toEqual([]);
    expect([...projected.supportingLinksByTarget]).toEqual([]);
  });

  it('重複した前提辺をUnit単位でまとめ、targetとsourceを安定順で返す', () => {
    const graph = {
      concepts: [
        concept('source.b', 'unit.source-b'),
        concept('target.b', 'unit.target-b'),
        concept('source.a', 'unit.source-a'),
        concept('target.a', 'unit.target-a'),
      ],
      relations: [
        relation('source.b', 'target.b'),
        relation('source.a', 'target.b'),
        relation('source.a', 'target.a'),
        relation('source.a', 'target.b'),
      ],
    };
    const displayed = new Set(['unit.target-b', 'unit.source-b', 'unit.target-a', 'unit.source-a']);

    const projected = projectRoadmapRelations(graph, displayed);

    expect([...projected.prerequisiteIdsByTarget]).toEqual([
      ['unit.target-a', ['unit.source-a']],
      ['unit.target-b', ['unit.source-a', 'unit.source-b']],
    ]);
  });

  it('入力を変更せず、呼び出しごとに新しいmapと配列を返す', () => {
    const graph = {
      concepts: [concept('source', 'unit.a'), concept('target', 'unit.b')],
      relations: [relation('source', 'target')],
    };
    const displayed = new Set(['unit.a', 'unit.b']);
    const graphBefore = structuredClone(graph);
    const displayedBefore = [...displayed];

    const first = projectRoadmapRelations(graph, displayed);
    const second = projectRoadmapRelations(graph, displayed);

    expect(graph).toEqual(graphBefore);
    expect([...displayed]).toEqual(displayedBefore);
    expect(first.prerequisiteIdsByTarget).not.toBe(second.prerequisiteIdsByTarget);
    expect(first.prerequisiteIdsByTarget.get('unit.b')).not.toBe(
      second.prerequisiteIdsByTarget.get('unit.b'),
    );
    expect(first.supportingLinksByTarget).not.toBe(second.supportingLinksByTarget);
  });
});
