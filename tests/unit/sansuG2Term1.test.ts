import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import { canonicalUnitId } from '../../src/core/learning/unitAliases';
import { buildRoadmapNodes } from '../../src/scenes/overworld/roadmap';

type Question = {
  id: string;
  subject: string;
  grade: number;
  unit: string;
  payload: { prompt?: string; template?: string };
  explanation?: string;
};

type Curriculum = {
  sources: Array<{ id: string }>;
  concepts: Array<{ unit: string }>;
};

const root = process.cwd();
const units = JSON.parse(readFileSync(join(root, 'content/units.json'), 'utf8')) as Unit[];
const curriculum = JSON.parse(
  readFileSync(join(root, 'content/curriculum/sansu-g2-term1.json'), 'utf8'),
) as Curriculum;

function readQuestions(directory: string): Question[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readQuestions(path);
    if (!entry.name.endsWith('.json')) return [];
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Question[] | { questions?: Question[] };
    return Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
  });
}

describe('小学2年1学期の算数教材', () => {
  const expectedUnits = [
    'sansu.g2.tables-graphs',
    'sansu.g2.column-add-subtract',
    'sansu.g2.nagasa',
    'sansu.g2.numbers-to-1000',
    'sansu.g2.kasa',
    'sansu.g2.jikan',
  ];

  it('公式年間指導計画に沿う6単元を順番どおり表示する', () => {
    const ids = buildRoadmapNodes({
      units: units.filter(
        (unit) =>
          unit.subject === 'sansu' && unit.grade === 2 && unit.placement?.terms.some((term) => term === 1),
      ),
      mastery: {},
      playerGrade: 2,
      challengeHigher: false,
      subjectLabel: () => '算数[さんすう]',
    }).map((node) => node.id);

    expect(ids).toEqual(expectedUnits);
  });

  it('旧8単元を重複なく6つの現行単元へ統合する', () => {
    expect(
      Array.from({ length: 8 }, (_, index) => canonicalUnitId(`sansu.g2.legacy-math-2-${index + 1}`)),
    ).toEqual([
      'sansu.g2.tables-graphs',
      'sansu.g2.column-add-subtract',
      'sansu.g2.column-add-subtract',
      'sansu.g2.column-add-subtract',
      'sansu.g2.jikan',
      'sansu.g2.nagasa',
      'sansu.g2.numbers-to-1000',
      'sansu.g2.kasa',
    ]);
  });

  it('各単元に6問以上の既存問題があり、解説も用意されている', () => {
    const questions = readQuestions(join(root, 'content/questions')).filter(
      (question) => question.subject === 'sansu' && question.grade === 2,
    );

    for (const unitId of expectedUnits) {
      const items = questions.filter((question) => canonicalUnitId(question.unit) === unitId);
      expect(items.length, unitId).toBeGreaterThanOrEqual(6);
      expect(
        items.every((item) => item.explanation?.trim()),
        unitId,
      ).toBe(true);
    }
  });

  it('現行単元は指導要領と2社の年間指導計画を出典に持つ', () => {
    for (const unitId of expectedUnits) {
      const unit = units.find((entry) => entry.id === unitId);
      expect(unit?.placement?.terms).toEqual([1]);
      expect(unit?.sourceIds).toEqual(
        expect.arrayContaining(['mext-82v12', 'tokyo-shoseki-r6-sansu-g2', 'kyoiku-shuppan-r6-sansu-g2']),
      );
    }
  });

  it('カリキュラム概念も旧単元ではなく現行単元を参照する', () => {
    const conceptUnits = curriculum.concepts.map((concept) => concept.unit);
    expect(conceptUnits.filter((unitId) => /^sansu\.g2\.legacy-math-2-[1-8]$/.test(unitId))).toEqual([]);
    for (const unitId of expectedUnits) {
      expect(conceptUnits).toContain(unitId);
    }
    expect(curriculum.sources.map((source) => source.id)).toEqual(
      expect.arrayContaining(['tokyo-shoseki-r6-sansu-g2', 'kyoiku-shuppan-r6-sansu-g2']),
    );
  });
});
