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
  payload: { prompt?: string };
  explanation?: string;
};

type Curriculum = {
  sources: Array<{ id: string }>;
  concepts: Array<{ unit: string }>;
};

const root = process.cwd();
const units = JSON.parse(readFileSync(join(root, 'content/units.json'), 'utf8')) as Unit[];
const curriculum = JSON.parse(
  readFileSync(join(root, 'content/curriculum/seikatsu-g2-foundations.json'), 'utf8'),
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

describe('小学2年1学期の生活科教材', () => {
  const expectedUnits = [
    'seikatsu.g2.spring',
    'seikatsu.g2.vegetables',
    'seikatsu.g2.town-exploration',
    'seikatsu.g2.ikimono',
  ];

  it('春から夏へ体験がつながる4単元を順番どおり表示する', () => {
    const ids = buildRoadmapNodes({
      units: units.filter(
        (unit) =>
          unit.subject === 'seikatsu' && unit.grade === 2 && unit.placement?.terms.some((term) => term === 1),
      ),
      mastery: {},
      playerGrade: 2,
      challengeHigher: false,
      subjectLabel: () => '生活科[せいかつか]',
    }).map((node) => node.id);

    expect(ids).toEqual(expectedUnits);
  });

  it('旧問題を町探検・公共施設・生きものの現行単元へ振り分ける', () => {
    expect(canonicalUnitId('seikatsu.g2.legacy-cur-1802-01')).toBe('seikatsu.g2.town-exploration');
    expect(canonicalUnitId('seikatsu.g2.legacy-cur-1802-02')).toBe('seikatsu.g2.public-places');
    expect(canonicalUnitId('seikatsu.g2.legacy-cur-1802-03')).toBe('seikatsu.g2.ikimono');
  });

  it('各1学期単元に6問以上あり、全問に学びを返す解説がある', () => {
    const questions = readQuestions(join(root, 'content/questions')).filter(
      (question) => question.subject === 'seikatsu' && question.grade === 2,
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

  it('現行単元は指導要領と教科書会社の年間指導計画を出典に持つ', () => {
    for (const unitId of expectedUnits) {
      const unit = units.find((entry) => entry.id === unitId);
      expect(unit?.placement?.terms).toContain(1);
      expect(unit?.sourceIds).toEqual(expect.arrayContaining(['mext-82v12', 'tokyo-shoseki-r6-seikatsu-g2']));
    }
    expect(units.find((entry) => entry.id === 'seikatsu.g2.public-places')?.placement?.terms).toEqual([2]);
  });

  it('カリキュラム概念は旧単元ではなく現行単元を参照する', () => {
    const conceptUnits = curriculum.concepts.map((concept) => concept.unit);
    expect(conceptUnits.filter((unitId) => /^seikatsu\.g2\.legacy-cur-1802-0[1-3]$/.test(unitId))).toEqual(
      [],
    );
    for (const unitId of [...expectedUnits, 'seikatsu.g2.public-places']) {
      expect(conceptUnits).toContain(unitId);
    }
    expect(curriculum.sources.map((source) => source.id)).toContain('tokyo-shoseki-r6-seikatsu-g2');
  });
});
