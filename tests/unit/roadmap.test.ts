import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import type { QuestionBase } from '../../src/questions/contracts';
import { QuestionBank } from '../../src/questions/engine';
import { buildRoadmapNodes } from '../../src/scenes/overworld/roadmap';
import { pickRoadmapQuestionId } from '../../src/scenes/overworld/roadmapPractice';

const units: Unit[] = [
  {
    id: 'sansu.g2.legacy-math-2-13',
    name: '九九',
    subject: 'sansu',
    grade: 2,
    order: 2,
    legacyNode: 'math_2_13',
  },
  {
    id: 'sansu.g1.tashizan',
    name: 'たし算',
    subject: 'sansu',
    grade: 1,
    order: 1,
    courseKind: 'required-subject',
    placement: {
      terms: [1],
      status: 'reference',
      sourceIds: ['annual-plan'],
      note: '年間[ねんかん]指導[しどう]計画[けいかく]を参照[さんしょう]',
    },
  },
  {
    id: 'sansu.g1.legacy-math-1-2',
    name: 'たし算（移行版）',
    subject: 'sansu',
    grade: 1,
    order: 1,
    legacyNode: 'math_1_2',
  },
  {
    id: 'kokugo.g1.legacy-jpn-1-2',
    name: '漢字',
    subject: 'kokugo',
    grade: 1,
    legacyNode: 'jpn_1_2',
  },
  {
    id: 'kokugo.g1.kanji',
    name: '1年[ねん]の漢字[かんじ]',
    subject: 'kokugo',
    grade: 1,
    courseKind: 'required-subject',
    placement: {
      terms: ['variable'],
      status: 'reference',
      sourceIds: ['annual-plan'],
      note: '学年[がくねん]を通[とお]して学[まな]ぶ',
    },
  },
  {
    id: 'kokugo.g1.legacy-kanji-1-10',
    name: 'がっこう・もじ',
    subject: 'kokugo',
    grade: 1,
    legacyNode: 'kanji_1_10',
  },
  {
    id: 'sansu.g5.legacy-math-5-13',
    name: '割合[わりあい]（移行版[いこうばん]）',
    subject: 'sansu',
    grade: 5,
    legacyNode: 'math_5_13',
  },
];

describe('buildRoadmapNodes', () => {
  it('教科・学年順に並べ、教科ごとの最初の未修得単元を current にする', () => {
    const nodes = buildRoadmapNodes({
      units,
      mastery: { 'sansu.g1.tashizan': { value: 0.9, n: 3, lastAt: 1 } },
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: (subject) => subject,
    });

    expect(nodes.map((node) => [node.id, node.state])).toEqual([
      ['kokugo.g1.kanji', 'current'],
      ['sansu.g1.tashizan', 'cleared'],
      ['sansu.g2.legacy-math-2-13', 'locked'],
      ['sansu.g5.legacy-math-5-13', 'locked'],
    ]);
    expect(nodes.find((node) => node.id === 'sansu.g1.tashizan')).toMatchObject({
      recommendedTerms: [1],
      courseKind: 'required-subject',
    });
  });

  it('上の学年へ挑戦する設定なら次の単元を開く', () => {
    const nodes = buildRoadmapNodes({
      units,
      mastery: {},
      playerGrade: 1,
      challengeHigher: true,
      subjectLabel: (subject) => subject,
    });
    expect(nodes.find((node) => node.id === 'sansu.g2.legacy-math-2-13')?.state).toBe('open');
  });
});

describe('pickRoadmapQuestionId', () => {
  it('選んだ単元に限定し、未出題の問題を優先する', () => {
    const bank = new QuestionBank();
    const question = (id: string, unit: string): QuestionBase => ({
      id,
      type: 'choice',
      subject: 'sansu',
      grade: 1,
      unit,
      payload: {},
    });
    bank.add(question('sansu.g1.kazu-10.0001', 'sansu.g1.kazu-10'));
    bank.add(question('sansu.g1.kazu-10.0002', 'sansu.g1.kazu-10'));
    bank.add(question('sansu.g1.tashizan.0001', 'sansu.g1.tashizan'));

    expect(
      pickRoadmapQuestionId(bank, 'sansu.g1.kazu-10', ['sansu.g1.kazu-10.0001'], { next: () => 0 }),
    ).toBe('sansu.g1.kazu-10.0002');
  });

  it('単元に問題がなければ null を返す', () => {
    expect(pickRoadmapQuestionId(new QuestionBank(), 'sansu.g1.kazu-10', [], { next: () => 0 })).toBeNull();
  });

  it('整理後の単元から、対応する旧問題も復習できる', () => {
    const bank = new QuestionBank();
    bank.add({
      id: 'legacy.sansu.g1.tashizan.0001',
      type: 'choice',
      subject: 'sansu',
      grade: 1,
      unit: 'sansu.g1.legacy-math-1-2',
      payload: {},
    });

    expect(pickRoadmapQuestionId(bank, 'sansu.g1.tashizan', [], { next: () => 0 })).toBe(
      'legacy.sansu.g1.tashizan.0001',
    );
  });

  it('整理後の漢字単元から、旧漢字グループの問題も復習できる', () => {
    const bank = new QuestionBank();
    bank.add({
      id: 'legacy.kokugo.g1.kanji-school.0001',
      type: 'choice',
      subject: 'kokugo',
      grade: 1,
      unit: 'kokugo.g1.legacy-kanji-1-10',
      payload: {},
    });

    expect(pickRoadmapQuestionId(bank, 'kokugo.g1.kanji', [], { next: () => 0 })).toBe(
      'legacy.kokugo.g1.kanji-school.0001',
    );
  });
});
