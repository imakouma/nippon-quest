import { describe, expect, it } from 'vitest';
import { mathReviewGroupsByGrade } from '../../src/tools/mathReviewOrder';

const precedes = (grade: number, groupId: string, basic: string, applied: string) => {
  const ids = mathReviewGroupsByGrade[grade]!.find((group) => group.id === groupId)!.questionIds;
  expect(ids).toContain(basic);
  expect(ids).toContain(applied);
  expect(ids.indexOf(basic)).toBeLessThan(ids.indexOf(applied));
};

describe('算数の単元内は前提となる基礎から応用へ進む', () => {
  it('小1は時計の針の役割を確認してから半時を読む', () => {
    precedes(
      1,
      'clock-basic',
      'legacy.sansu.g1.math-1-8.c6e63b71e522',
      'legacy.sansu.g1.math-1-8.6c2c0a80bec3',
    );
  });
  it('小1は10をつくる考え方から繰り上がりの計算へ進む', () => {
    precedes(
      1,
      'carry-addition',
      'sansu.g1.kuriagari-kurisagari.0001',
      'sansu.g1.kazu-100.ringo-keypad-0001',
    );
  });
  it('小2は整理済みグラフを読んでから未整理の25枚を集計する', () => {
    precedes(2, 'data', 'legacy.sansu.g2.math-2-1.ac73faced8c7', 'legacy.sansu.g2.math-2-1.14017faba940');
  });
  it('小2は繰り下がりなしを先に練習する', () => {
    precedes(
      2,
      'subtraction',
      'legacy.sansu.g2.math-2-3.4d247235dc89',
      'legacy.sansu.g2.math-2-3.57c1ba67d84b',
    );
  });
  it('小2は同じ段の九九1問からまとめて入力する練習へ進む', () => {
    precedes(
      2,
      'multiplication',
      'legacy.sansu.g2.math-2-13.4c6ab4bfb33b',
      'legacy.sansu.g2.math-2-13.371db032bd35',
    );
    precedes(
      2,
      'multiplication',
      'legacy.sansu.g2.math-2-13.51403a0bbe49',
      'legacy.sansu.g2.math-2-13.969f97b4124e',
    );
  });
  it('小3は時間の単位を確認してから時をまたぐ経過時間を求める', () => {
    precedes(3, 'time', 'legacy.sansu.g3.math-3-5.55fdb3828b3b', 'legacy.sansu.g3.math-3-5.04ffc8e1c045');
  });
  it('小4はそろばんの読みから計算へ進む', () => {
    precedes(
      4,
      'soroban',
      'sansu.g4.legacy-math-4-6.soroban-read-236',
      'sansu.g4.legacy-math-4-6.soroban-add',
    );
  });
  it('小4は面積を直接求めてから辺の長さを逆算する', () => {
    precedes(
      4,
      'unit-11',
      'legacy.sansu.g4.math-4-11.94ab69ca5981',
      'legacy.sansu.g4.math-4-11.53c680ff734b',
    );
  });
  it('小5は示された立方体の体積から段数を変える応用へ進む', () => {
    precedes(5, 'volume', 'sansu.g5.curriculum.volume-unit-cubes', 'sansu.g5.curriculum.volume-layers');
  });
  it('小6は対称の軸を確認してから複数の文字を分類する', () => {
    precedes(6, 'symmetry', 'legacy.sansu.g6.math-6-1.146ac196a443', 'legacy.sansu.g6.math-6-1.e138da301bd3');
  });
});
