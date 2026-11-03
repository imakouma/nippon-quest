import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';

const root = process.cwd();
const units = JSON.parse(readFileSync(join(root, 'content/units.json'), 'utf8')) as Unit[];

describe('低学年の理科・社会・英語の境界', () => {
  it('理科と社会は1年生の独立した必修単元にしない', () => {
    const invalid = units.filter(
      (unit) =>
        unit.grade === 1 && ['rika', 'shakai'].includes(unit.subject) && unit.courseKind !== 'supplementary',
    );
    expect(invalid).toEqual([]);
  });

  it('英語単元は3年生からにする', () => {
    expect(units.filter((unit) => unit.subject === 'eigo' && unit.grade <= 2)).toEqual([]);
  });
});
