import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { unitSchema } from '../../src/core/content/schemas';
import { buildCurriculumGraphQuality, curriculumGraph } from '../../src/core/learning';

const units = unitSchema
  .array()
  .parse(JSON.parse(readFileSync(resolve(import.meta.dirname, '../../content/units.json'), 'utf8')));

describe('生活・理科・社会・英語のロードマップ関係', () => {
  const report = buildCurriculumGraphQuality({ units, graph: curriculumGraph });

  for (const subject of ['seikatsu', 'rika', 'shakai', 'eigo'] as const) {
    it(`${subject} の全正式表示単元がつながり、分岐と合流がある`, () => {
      expect(report.bySubject[subject]).toMatchObject({ isolated: [] });
      expect(report.bySubject[subject]!.branches).toBeGreaterThan(0);
      expect(report.bySubject[subject]!.merges).toBeGreaterThan(0);
    });
  }

  it('追加した関係に危険なハードロックや循環がない', () => {
    expect(report.duplicateRelations).toEqual([]);
    expect(report.crossSubjectEdges).toEqual([]);
    expect(report.reverseGradeEdges).toEqual([]);
    expect(
      report.prerequisiteCycles.filter((cycle) =>
        cycle.some((unitId) => /^(seikatsu|rika|shakai|eigo)\./.test(unitId)),
      ),
    ).toEqual([]);
    expect(
      report.unitCycles.filter((cycle) =>
        cycle.some((unitId) => /^(seikatsu|rika|shakai|eigo)\./.test(unitId)),
      ),
    ).toEqual([]);
  });
});
