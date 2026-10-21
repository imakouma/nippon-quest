import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import { buildRoadmapNodes } from '../../src/scenes/overworld/roadmap';

type Question = {
  id: string;
  unit: string;
  type: string;
  payload: { prompt: string; choices?: Array<{ text: string }>; cards?: Array<{ text: string }> };
  explanation?: string;
};

type CurriculumGraph = {
  concepts: Array<{ id: string; unit: string; recommendedWindow: { stage: string } }>;
  questionLinks: Array<{
    questionId: string;
    concepts: Array<{ conceptId: string; role: string }>;
  }>;
};

const root = process.cwd();
const units = JSON.parse(readFileSync(join(root, 'content/units.json'), 'utf8')) as Unit[];
const graph = JSON.parse(
  readFileSync(join(root, 'content/curriculum/seikatsu-g1-term1.json'), 'utf8'),
) as CurriculumGraph;

function questions(file: string): Question[] {
  return JSON.parse(readFileSync(join(root, 'content/questions/seikatsu/g1', file), 'utf8')) as Question[];
}

describe('小学1年3学期の生活科教材', () => {
  it('成長を振り返る現行単元は3学期に6問以上を持つ', () => {
    const unitId = 'seikatsu.g1.next-grade';
    const unit = units.find((entry) => entry.id === unitId);
    const items = questions('next-grade.json');

    expect(unit?.placement?.terms).toEqual([3]);
    expect(items.length).toBeGreaterThanOrEqual(6);
    expect(items.every((item) => item.unit === unitId)).toBe(true);
    expect(items.every((item) => item.explanation?.trim())).toBe(true);
  });

  it('記録の比較・支えてくれた人・次の目標を一続きに扱う', () => {
    const text = JSON.stringify(questions('next-grade.json'));
    expect(text).toContain('くらべ');
    expect(text).toContain('たすけ');
    expect(text).toContain('2年生[ねんせい]');
    expect(text).not.toContain('いちばん えらい');
    expect(text).not.toContain('できない ひと');
  });

  it('成長を振り返る手順を操作して考える問題を含む', () => {
    const items = questions('next-grade.json');
    expect(items.some((item) => item.type === 'sort-order' && (item.payload.cards?.length ?? 0) >= 4)).toBe(
      true,
    );
  });

  it('3学期の単元は家庭・冬・進級準備の順にまとまる', () => {
    const ids = buildRoadmapNodes({
      units: units.filter(
        (unit) =>
          unit.subject === 'seikatsu' && unit.grade === 1 && unit.placement?.terms.some((term) => term === 3),
      ),
      mastery: {},
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: () => '生活[せいかつ]',
    }).map((node) => node.id);

    expect(ids).toEqual(['seikatsu.g1.home-life', 'seikatsu.g1.kisetsu', 'seikatsu.g1.next-grade']);
  });

  it('家庭での継続と成長の振り返りは3学期概念へ3問以上つながる', () => {
    const lateConceptIds = new Set(
      graph.concepts
        .filter(
          (concept) =>
            concept.recommendedWindow.stage === 'late' &&
            ['seikatsu.g1.home-life', 'seikatsu.g1.next-grade'].includes(concept.unit),
        )
        .map((concept) => concept.id),
    );
    const linkedQuestions = graph.questionLinks.filter((link) =>
      link.concepts.some((concept) => concept.role === 'primary' && lateConceptIds.has(concept.conceptId)),
    );

    expect(lateConceptIds.size).toBeGreaterThanOrEqual(2);
    expect(
      linkedQuestions.filter((link) => link.questionId.startsWith('seikatsu.g1.home-life.')).length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      linkedQuestions.filter((link) => link.questionId.startsWith('seikatsu.g1.next-grade.')).length,
    ).toBeGreaterThanOrEqual(6);
  });
});
