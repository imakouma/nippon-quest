import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { unitSchema } from '../../src/core/content/schemas';
import { buildCurriculumGraphQuality, curriculumGraph, isRequiredCourse } from '../../src/core/learning';
import { canonicalUnitId } from '../../src/core/learning/unitAliases';

const units = unitSchema
  .array()
  .parse(JSON.parse(readFileSync(resolve(import.meta.dirname, '../../content/units.json'), 'utf8')));

const formalSubjects = ['seikatsu', 'rika', 'shakai', 'eigo'] as const;

describe('生活・理科・社会・英語のロードマップ関係', () => {
  const report = buildCurriculumGraphQuality({ units, graph: curriculumGraph });

  for (const subject of formalSubjects) {
    it(`${subject} の全正式表示単元が孤立せず、分岐とAND合流を持つ`, () => {
      const requiredUnits = units.filter(
        (unit) =>
          unit.subject === subject &&
          unit.courseKind !== undefined &&
          isRequiredCourse({ ...unit, courseKind: unit.courseKind }),
      );
      const subjectReport = report.bySubject[subject]!;
      const canonicalRequiredUnits = new Set(requiredUnits.map((unit) => canonicalUnitId(unit.id)));

      expect(subjectReport.units).toBeGreaterThan(0);
      expect(subjectReport.units).toBe(canonicalRequiredUnits.size);
      expect(subjectReport.isolated).toEqual([]);
      expect(subjectReport.branches).toBeGreaterThan(0);
      expect(subjectReport.merges).toBeGreaterThan(0);

      const incomingCount = new Map<string, number>();
      for (const edge of report.edges.filter((edge) => edge.to.startsWith(`${subject}.`))) {
        incomingCount.set(edge.to, (incomingCount.get(edge.to) ?? 0) + 1);
      }
      expect([...incomingCount.values()].some((count) => count >= 2 && count <= 3)).toBe(true);
      expect(Math.max(...incomingCount.values())).toBeLessThanOrEqual(3);
    });
  }

  it('英語の補助教材を正式課程の前提条件にしない', () => {
    const supplementaryIds = new Set(
      units
        .filter((unit) => unit.subject === 'eigo' && unit.courseKind === 'supplementary')
        .map((unit) => unit.id),
    );
    const conceptUnits = new Map(curriculumGraph.concepts.map((concept) => [concept.id, concept.unit]));
    const crossings = curriculumGraph.relations.filter((relation) => {
      if (relation.kind !== 'prerequisite') return false;
      const fromUnit = conceptUnits.get(relation.from);
      const toUnit = conceptUnits.get(relation.to);
      return Boolean(fromUnit && toUnit && supplementaryIds.has(fromUnit) !== supplementaryIds.has(toUnit));
    });

    expect(crossings).toEqual([]);
  });

  it('進行用関係は一次資料照合済みで、教員確認済みを名乗らない', () => {
    const progressionSources = new Set([
      'mext-h29-rika-progression',
      'mext-h29-shakai-progression',
      'mext-h29-eigo-progression',
    ]);
    const progressionRelations = curriculumGraph.relations.filter((relation) =>
      relation.sourceIds.some((sourceId) => progressionSources.has(sourceId)),
    );

    expect(progressionRelations.length).toBeGreaterThan(0);
    expect(progressionRelations.every((relation) => relation.reviewStatus === 'source-checked')).toBe(true);
  });

  it('追加した関係に危険なハードロックや循環がない', () => {
    expect(report.duplicateRelations).toEqual([]);
    expect(report.crossSubjectEdges).toEqual([]);
    expect(report.reverseGradeEdges).toEqual([]);
    expect(report.unitCycles).toEqual([]);
  });
});
