import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import { buildRoadmapNodes } from '../../src/scenes/overworld/roadmap';

const units: Unit[] = [
  {
    id: 'sansu.g2.legacy-math-2-13',
    name: '九九',
    subject: 'sansu',
    grade: 2,
    order: 2,
    legacyNode: 'math_2_13',
  },
  { id: 'sansu.g1.tashizan', name: 'たし算', subject: 'sansu', grade: 1, order: 1 },
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
