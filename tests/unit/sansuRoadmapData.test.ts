import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { unitSchema } from '../../src/core/content/schemas';
import {
  buildCurriculumGraphQuality,
  mergeCurriculumGraphs,
  parseCurriculumGraphFragment,
} from '../../src/core/learning';
import { canonicalUnitId } from '../../src/core/learning/unitAliases';

const root = join(import.meta.dirname, '../..');
const units = unitSchema.array().parse(JSON.parse(readFileSync(join(root, 'content/units.json'), 'utf8')));
const fragments = readdirSync(join(root, 'content/curriculum'))
  .filter((name) => name.endsWith('.json'))
  .map((name) => {
    const raw = JSON.parse(readFileSync(join(root, 'content/curriculum', name), 'utf8')) as unknown;
    const parsed = parseCurriculumGraphFragment(raw);
    if (!parsed.graph) throw new Error(`${name}: ${parsed.errors.join('\n')}`);
    return parsed.graph;
  });
const merged = mergeCurriculumGraphs(fragments);
if (!merged.graph) throw new Error(merged.errors.join('\n'));

describe('算数ロードマップデータ', () => {
  it('1〜6年の正式表示単元を枝分かれ・合流する循環なしのグラフへ接続する', () => {
    const report = buildCurriculumGraphQuality({ units, graph: merged.graph! });
    const sansu = report.bySubject.sansu;
    const sansuEdges = report.edges.filter(isSansuEdge);
    const incidentUnits = new Set(sansuEdges.flatMap((edge) => [edge.from, edge.to]));
    const coveredGrades = new Set(
      units.filter((unit) => incidentUnits.has(canonicalUnitId(unit.id))).map((unit) => unit.grade),
    );
    const incomingCounts = new Map<string, number>();
    for (const edge of sansuEdges) incomingCounts.set(edge.to, (incomingCounts.get(edge.to) ?? 0) + 1);

    expect(sansu).toBeDefined();
    expect(sansu?.isolated).toEqual([]);
    expect(sansu?.branches).toBeGreaterThanOrEqual(10);
    expect(sansu?.merges).toBeGreaterThanOrEqual(10);
    expect([...incomingCounts.values()].filter((count) => count >= 2).length).toBeGreaterThanOrEqual(5);
    expect(Math.max(...incomingCounts.values())).toBeLessThanOrEqual(3);
    expect([...coveredGrades].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(report.unitCycles.filter(isSansuCycle)).toEqual([]);
    expect(report.reverseGradeEdges.filter(isSansuEdge)).toEqual([]);
    expect(report.crossSubjectEdges.filter(isSansuEdge)).toEqual([]);
    expect(report.duplicateRelations).toEqual([]);
  });

  it('算数の前提線は根拠と一次資料と未監修状態を保持する', () => {
    const relations = merged.graph!.relations.filter(
      (relation) => relation.kind === 'prerequisite' && relation.from.startsWith('sansu.'),
    );

    expect(relations.length).toBeGreaterThan(80);
    for (const relation of relations) {
      expect(relation.rationale.length).toBeGreaterThan(0);
      expect(relation.sourceIds.length).toBeGreaterThan(0);
      expect(relation.reviewStatus).not.toBe('expert-reviewed');
    }
  });

  it('加法と減法を直列化せず、共通の数概念から並行して解放する', () => {
    const relations = merged.graph!.relations;
    const addConcepts = new Set(
      merged
        .graph!.concepts.filter(
          (concept) => concept.subject === 'sansu' && canonicalUnitId(concept.unit) === 'sansu.g1.tashizan',
        )
        .map((concept) => concept.id),
    );
    const subtractionConcepts = new Set(
      merged
        .graph!.concepts.filter(
          (concept) => concept.subject === 'sansu' && canonicalUnitId(concept.unit) === 'sansu.g1.hikizan',
        )
        .map((concept) => concept.id),
    );

    expect(
      relations.filter(
        (relation) =>
          relation.kind === 'prerequisite' &&
          ((addConcepts.has(relation.from) && subtractionConcepts.has(relation.to)) ||
            (subtractionConcepts.has(relation.from) && addConcepts.has(relation.to))),
      ),
    ).toEqual([]);
  });
});

function isSansuCycle(cycle: readonly string[]): boolean {
  return cycle.some((id) => id.startsWith('sansu.'));
}

function isSansuEdge(edge: { from: string; to: string }): boolean {
  return edge.from.startsWith('sansu.') || edge.to.startsWith('sansu.');
}
