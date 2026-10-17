import { describe, expect, it } from 'vitest';
import { applyRegionWalls } from '../../scripts/regions/partitionWalls';

function gridNeighbors(width: number, height: number): (i: number) => number[] {
  return (i) => {
    const x = i % width;
    return [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width].filter(
      (next) => next >= 0 && next < width * height,
    );
  };
}

describe('applyRegionWalls', () => {
  it('隣り合う地域の境界を壁にし、指定された関所だけを通れる状態で残す', () => {
    const region = Int32Array.from([
      0,
      0,
      1,
      1, // 上段
      0,
      0,
      1,
      1, // 下段
    ]);

    const gates = applyRegionWalls({
      prefId: 'sample',
      ids: ['west', 'east'],
      region,
      distances: [Int32Array.from([0, 1, 2, 3, 1, 2, 3, 4]), Int32Array.from([3, 2, 1, 0, 4, 3, 2, 1])],
      seedIndexes: [[0], [3]],
      protectedIndexes: new Set(),
      width: 4,
      around: gridNeighbors(4, 2),
      gates: [{ between: ['west', 'east'], openedBy: 'west' }],
    });

    expect(gates).toEqual([{ i: 2, between: ['west', 'east'], openedBy: 'west' }]);
    expect([...region]).toEqual([0, 0, 1, 1, 0, 0, -1, 1]);
  });

  it('境界を共有しない地域どうしの関所は生成を止める', () => {
    const region = Int32Array.from([0, 1, 2]);

    expect(() =>
      applyRegionWalls({
        prefId: 'sample',
        ids: ['west', 'center', 'east'],
        region,
        distances: [Int32Array.from([0, 1, 2]), Int32Array.from([1, 0, 1]), Int32Array.from([2, 1, 0])],
        seedIndexes: [[0], [1], [2]],
        protectedIndexes: new Set(),
        width: 3,
        around: gridNeighbors(3, 1),
        gates: [{ between: ['west', 'east'], openedBy: 'west' }],
      }),
    ).toThrow('sample: west・east は となりあって いないので 関所を おけません');
  });
});
