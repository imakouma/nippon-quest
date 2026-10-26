import { describe, expect, it } from 'vitest';
import { availableRoadmapSubjects } from '../../src/core/learning/subjectUnlocks';
import type { RoadmapNode } from '../../src/shared/menuModel';

function node(
  subject: string,
  grade: number,
  state: RoadmapNode['state'] = 'locked',
  courseKind: RoadmapNode['courseKind'] = 'required-subject',
): RoadmapNode {
  return {
    id: `${subject}.g${grade}.${courseKind}.${state}`,
    name: subject,
    subject,
    subjectLabel: subject,
    grade,
    courseKind,
    mastery: state === 'cleared' || state === 'review' ? 0.9 : 0,
    attempts: state === 'cleared' || state === 'review' ? 3 : 0,
    retention: 0,
    prerequisiteIds: [],
    x: 0,
    y: 0,
    visibility: 'revealed',
    state,
  };
}

const targetSubjects = [node('rika', 3), node('shakai', 3), node('eigo', 1, 'open', 'supplementary')];

describe('ロードマップの教科解放', () => {
  it('最初は国語・算数・生活科だけを利用できる', () => {
    const nodes = [
      node('kokugo', 1, 'current'),
      node('sansu', 1, 'current'),
      node('seikatsu', 1, 'current'),
      ...targetSubjects,
    ];

    expect([...availableRoadmapSubjects(nodes)]).toEqual(['kokugo', 'sansu', 'seikatsu']);
  });

  it('生活科の1・2年必修をすべて終えると理科と社会を同時に解放する', () => {
    const nodes = [
      node('kokugo', 1),
      node('sansu', 1),
      node('seikatsu', 1, 'cleared'),
      node('seikatsu', 2, 'review'),
      node('seikatsu', 2, 'open', 'supplementary'),
      ...targetSubjects,
    ];

    expect([...availableRoadmapSubjects(nodes)]).toEqual(['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu']);
  });

  it('生活科が1年分だけ、または必修が1つでも未完了なら理科と社会を解放しない', () => {
    const missingGrade = [
      node('kokugo', 1),
      node('sansu', 1),
      node('seikatsu', 1, 'cleared'),
      ...targetSubjects,
    ];
    const incomplete = [
      node('kokugo', 1),
      node('sansu', 1),
      node('seikatsu', 1, 'cleared'),
      node('seikatsu', 2, 'open'),
      ...targetSubjects,
    ];

    expect(availableRoadmapSubjects(missingGrade).has('rika')).toBe(false);
    expect(availableRoadmapSubjects(incomplete).has('shakai')).toBe(false);
  });

  it('国語と算数の1・2年必修を両方すべて終えたときだけ英語を解放する', () => {
    const completed = [
      node('kokugo', 1, 'cleared'),
      node('kokugo', 2, 'review'),
      node('sansu', 1, 'cleared'),
      node('sansu', 2, 'cleared'),
      node('seikatsu', 1),
      ...targetSubjects,
    ];
    const mathIncomplete = completed.map((item) =>
      item.subject === 'sansu' && item.grade === 2 ? { ...item, state: 'current' as const } : item,
    );

    expect(availableRoadmapSubjects(completed).has('eigo')).toBe(true);
    expect(availableRoadmapSubjects(mathIncomplete).has('eigo')).toBe(false);
  });

  it('開発者モードでは進捗に関係なく全教科を利用できる', () => {
    const nodes = [node('kokugo', 1), node('sansu', 1), node('seikatsu', 1), ...targetSubjects];

    expect([...availableRoadmapSubjects(nodes, true)]).toEqual([
      'kokugo',
      'sansu',
      'rika',
      'shakai',
      'seikatsu',
      'eigo',
    ]);
  });
});
