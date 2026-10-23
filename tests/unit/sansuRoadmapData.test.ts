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
  it('全正式表示単元を枝分かれ・合流する循環なしのグラフへ接続する', () => {
    const report = buildCurriculumGraphQuality({ units, graph: merged.graph! });
    const sansu = report.bySubject.sansu;

    expect(sansu).toBeDefined();
    expect(sansu?.isolated).toEqual([]);
    expect(sansu?.branches).toBeGreaterThanOrEqual(10);
    expect(sansu?.merges).toBeGreaterThanOrEqual(10);
    expect(sansu?.hardMerges).toBeGreaterThanOrEqual(5);
    expect(report.unitCycles.filter(isSansuCycle)).toEqual([]);
    expect(report.prerequisiteCycles.filter(isSansuCycle)).toEqual([]);
    expect(report.reverseGradeEdges.filter(isSansuEdge)).toEqual([]);
    expect(report.duplicateRelations).toEqual([]);
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
