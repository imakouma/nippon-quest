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
  it('1〜6年の正式単元を、出典確認済みの分岐・合流グラフへ接続する', () => {
    const graph = loadCurriculumGraph();
    const units = unitSchema
      .array()
      .parse(JSON.parse(readFileSync(resolve(root, 'content/units.json'), 'utf8')) as unknown);
    const report = buildCurriculumGraphQuality({ units, graph });
    const kokugo = report.bySubject.kokugo!;
    const kokugoUnits = units.filter(
      (unit) => unit.subject === 'kokugo' && unit.courseKind === 'required-subject',
    );
    const kokugoRelations = graph.relations.filter(
      (relation) =>
        relation.kind === 'prerequisite' &&
        relation.from.startsWith('kokugo.') &&
        relation.to.startsWith('kokugo.'),
    );
    const incoming = new Map<string, number>();
    const outgoing = new Map<string, number>();
    for (const edge of report.edges.filter(
      (edge) => edge.from.startsWith('kokugo.') && edge.to.startsWith('kokugo.'),
    )) {
      incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
      outgoing.set(edge.from, (outgoing.get(edge.from) ?? 0) + 1);
    }

    expect(new Set(kokugoUnits.map((unit) => unit.grade))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    expect(kokugo.isolated).toEqual([]);
    expect(kokugo.branches).toBeGreaterThanOrEqual(6);
    expect(kokugo.merges).toBeGreaterThanOrEqual(6);
    expect([...incoming.values()].filter((count) => count >= 2 && count <= 3).length).toBeGreaterThanOrEqual(
      6,
    );
    expect([...outgoing.values()].filter((count) => count >= 2).length).toBeGreaterThanOrEqual(6);
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
    expect(kokugoRelations.length).toBeGreaterThanOrEqual(kokugoUnits.length - 1);
    expect(
      kokugoRelations.every(
        (relation) =>
          relation.reviewStatus === 'source-checked' &&
          relation.sourceIds.length > 0 &&
          relation.rationale.length > 0,
      ),
    ).toBe(true);
  });
});
