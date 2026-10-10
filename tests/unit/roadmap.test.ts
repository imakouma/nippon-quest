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
      ['kokugo.g1.legacy-jpn-1-2', 'current'],
      ['sansu.g1.legacy-math-1-2', 'cleared'],
      ['sansu.g2.legacy-math-2-13', 'locked'],
    ]);
    expect(nodes.find((node) => node.id === 'sansu.g1.legacy-math-1-2')).toMatchObject({
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
});
