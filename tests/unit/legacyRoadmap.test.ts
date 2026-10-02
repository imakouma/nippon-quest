import { describe, expect, it } from 'vitest';
import { extractLegacyRoadmap, roadmapUnits } from '../../scripts/import-legacy-roadmap';

describe('旧ロードマップ移行', () => {
  it('静的ノードを現在版の単元へ変換する', () => {
    const source = `{ id: "math_2_5", grade: 2, step: 14, title: "時間と生活", topic: "時刻", icon: "" }`;
    expect(roadmapUnits(extractLegacyRoadmap(source, 'roadmapDatabase.ts'))).toEqual([
      expect.objectContaining({
        id: 'sansu.g2.legacy-math-2-5',
        name: '時間と生活',
        order: 14,
        legacyNode: 'math_2_5',
      }),
    ]);
  });

  it('同じ旧ノードが複数定義されても一つにする', () => {
    const row = `{ id: "sci_5_1", grade: 5, step: 1, title: "雲と天気", topic: "", icon: "" }`;
    expect(roadmapUnits(extractLegacyRoadmap(`${row}\n${row}`, 'x.ts'))).toHaveLength(1);
  });
});
