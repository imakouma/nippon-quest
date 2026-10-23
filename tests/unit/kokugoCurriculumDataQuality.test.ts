import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { unitSchema } from '../../src/core/content/schemas';
import {
  buildCurriculumGraphQuality,
  mergeCurriculumGraphs,
  parseCurriculumGraphFragment,
  type CurriculumGraph,
} from '../../src/core/learning';

const root = resolve(import.meta.dirname, '../..');

function jsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name);
    return statSync(path).isDirectory() ? jsonFiles(path) : name.endsWith('.json') ? [path] : [];
  });
}

function loadCurriculumGraph(): CurriculumGraph {
  const fragments = jsonFiles(resolve(root, 'content/curriculum')).map((file) => {
    const result = parseCurriculumGraphFragment(JSON.parse(readFileSync(file, 'utf8')) as unknown);
    expect(result.errors, file).toEqual([]);
    return result.graph!;
  });
  const merged = mergeCurriculumGraphs(fragments);
  expect(merged.errors).toEqual([]);
  return merged.graph!;
}

describe('国語カリキュラムのロードマップ品質', () => {
  it('正式表示する全単元を、循環のない分岐・合流グラフへ接続する', () => {
    const graph = loadCurriculumGraph();
    const units = unitSchema
      .array()
      .parse(JSON.parse(readFileSync(resolve(root, 'content/units.json'), 'utf8')) as unknown);
    const report = buildCurriculumGraphQuality({ units, graph });
    const kokugo = report.bySubject.kokugo!;

    expect(kokugo.isolated).toEqual([]);
    expect(kokugo.branches).toBeGreaterThan(0);
    expect(kokugo.merges).toBeGreaterThan(0);
    expect(kokugo.hardMerges).toBeGreaterThan(0);
    expect(kokugo.hardMerges).toBeLessThanOrEqual(8);
    expect(kokugo.edges).toBeGreaterThan(kokugo.hardEdges);
    expect(report.duplicateRelations.filter((relation) => relation.includes('kokugo.'))).toEqual([]);
    expect(
      report.reverseGradeEdges.filter(
        (edge) => edge.from.startsWith('kokugo.') || edge.to.startsWith('kokugo.'),
      ),
    ).toEqual([]);
    expect(
      report.crossSubjectEdges.filter(
        (edge) => edge.from.startsWith('kokugo.') || edge.to.startsWith('kokugo.'),
      ),
    ).toEqual([]);
    expect(report.unitCycles.filter((cycle) => cycle.some((unit) => unit.startsWith('kokugo.')))).toEqual([]);
    expect(
      report.prerequisiteCycles.filter((cycle) => cycle.some((unit) => unit.startsWith('kokugo.'))),
    ).toEqual([]);
    expect(
      graph.relations
        .filter((relation) => relation.from.startsWith('kokugo.'))
        .every(
          (relation) =>
            relation.reviewStatus === 'source-checked' &&
            relation.sourceIds.length > 0 &&
            relation.rationale.length > 0,
        ),
    ).toBe(true);
  });
});
