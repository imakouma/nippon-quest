import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import type { QuestionBase } from '../../src/questions/contracts';
import { QuestionBank } from '../../src/questions/engine';
import { buildRoadmapNodes } from '../../src/scenes/overworld/roadmap';
import { pickRoadmapQuestionId } from '../../src/scenes/overworld/roadmapPractice';

const root = process.cwd();
const units = JSON.parse(readFileSync(join(root, 'content/units.json'), 'utf8')) as Unit[];
const legacyQuestions = ['legacy-math-1-7', 'legacy-math-1-9'].flatMap(
  (unit) =>
    JSON.parse(readFileSync(join(root, `content/questions/sansu/g1/${unit}/set-001.json`), 'utf8')) as Array<
      QuestionBase & { payload: { prompt?: string } }
    >,
);

describe('小学1年3学期の算数教材', () => {
  it('旧単元を重複表示せず、現行6単元を学習順に並べる', () => {
    const targetIds = new Set([
      'sansu.g1.kazu-100',
      'sansu.g1.kuriagari-kurisagari',
      'sansu.g1.tens-calculation',
      'sansu.g1.word-problems',
      'sansu.g1.katachi',
      'sansu.g1.data',
    ]);
    const legacyNodes = new Set(['math_1_5', 'math_1_6', 'math_1_7', 'math_1_9']);
    const term3Units = units.filter(
      (unit) => targetIds.has(unit.id) || legacyNodes.has(unit.legacyNode ?? ''),
    );

    const nodes = buildRoadmapNodes({
      units: term3Units,
      mastery: {},
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: () => '算数[さんすう]',
    });

    expect(nodes.map((node) => node.id)).toEqual([
      'sansu.g1.kuriagari-kurisagari',
      'sansu.g1.kazu-100',
      'sansu.g1.tens-calculation',
      'sansu.g1.word-problems',
      'sansu.g1.katachi',
      'sansu.g1.data',
    ]);
  });

  it.each([
    ['sansu.g1.tens-calculation', 'sansu.g1.legacy-math-1-7'],
    ['sansu.g1.word-problems', 'sansu.g1.legacy-math-1-9'],
  ])('%s から対応する旧問題を出題できる', (currentUnit, legacyUnit) => {
    const bank = new QuestionBank();
    const question: QuestionBase = {
      id: `legacy.${legacyUnit}.0001`,
      type: 'text-input',
      subject: 'sansu',
      grade: 1,
      unit: legacyUnit,
      payload: {},
    };
    bank.add(question);

    expect(pickRoadmapQuestionId(bank, currentUnit, [], { next: () => 0 })).toBe(question.id);
  });

  it('100までの計算は、画像なしでも式と演算が分かる', () => {
    const calculations = legacyQuestions.filter((question) => question.unit === 'sansu.g1.legacy-math-1-7');

    expect(calculations).toHaveLength(12);
    for (const question of calculations) {
      expect(question.payload.prompt).toMatch(/^\d+ [＋−] \d+ は いくつ？$/);
    }
  });

  it('同数のまとまりは、乗除の式を先取りせず加法で説明する', () => {
    const wordProblems = legacyQuestions.filter((question) => question.unit === 'sansu.g1.legacy-math-1-9');
    const text = JSON.stringify(wordProblems);

    expect(wordProblems.length).toBeGreaterThanOrEqual(10);
    expect(text).not.toMatch(/[×÷]/);
    expect(text).toContain('+');
  });
});
