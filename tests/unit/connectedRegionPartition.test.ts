import { describe, expect, it } from 'vitest';
import { partitionConnectedRegions } from '../../scripts/regions/connectedPartition';

function gridNeighbors(width: number, height: number): (i: number) => number[] {
  return (i) => {
    const x = i % width;
    return [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width].filter(
      (next) => next >= 0 && next < width * height,
    );
  };
}

function connectedCells(region: Int32Array, regionIndex: number, around: (i: number) => number[]): number {
  const first = region.findIndex((value) => value === regionIndex);
  if (first < 0) return 0;
  const seen = new Set([first]);
  const queue = [first];
  for (let head = 0; head < queue.length; head++)
    for (const next of around(queue[head]!))
      if (region[next] === regionIndex && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
  return seen.size;
}

describe('partitionConnectedRegions', () => {
  it('青森相当の10地域でも、使う並びだけを評価して分割できる', () => {
    const width = 20;
    const around = gridNeighbors(width, 1);
    const anchors = Array.from({ length: 10 }, (_, index) => [index * 2]);

    const region = partitionConnectedRegions({
      prefId: 'ten-regions',
      cellCount: width,
      walkable: () => true,
      around,
      anchors,
      requiredAdjacencies: Array.from({ length: 9 }, (_, index) => [index, index + 1]),
    });

    anchors.forEach(([anchor], regionIndex) => expect(region[anchor!]).toBe(regionIndex));
    expect(new Set(region)).toEqual(new Set(Array.from({ length: 10 }, (_, index) => index)));
  });

  it('離れたhard anchorを同じ地域へ含めながら、全地域を4近傍で1連結にする', () => {
    const width = 7;
    const height = 7;
    const around = gridNeighbors(width, height);
    const anchors = [[0, width * height - 1], [width - 1], [width * (height - 1)]];

    const region = partitionConnectedRegions({
      prefId: 'sample',
      cellCount: width * height,
      walkable: () => true,
      around,
      anchors,
    });

    anchors.forEach((indexes, regionIndex) =>
      indexes.forEach((index) =>
        expect(region[index], `region ${regionIndex} anchor ${index}`).toBe(regionIndex),
      ),
    );
    for (let regionIndex = 0; regionIndex < anchors.length; regionIndex++)
      expect(connectedCells(region, regionIndex, around)).toBe(
        [...region].filter((value) => value === regionIndex).length,
      );
  });

  it('別地域のhard anchorが同じマスを要求したらsilent relocationせず生成を止める', () => {
    expect(() =>
      partitionConnectedRegions({
        prefId: 'sample',
        cellCount: 3,
        walkable: () => true,
        around: gridNeighbors(3, 1),
        anchors: [
          [0, 1],
          [1, 2],
        ],
      }),
    ).toThrow('sample: hard anchor 1 を複数の地域が共有しています');
  });
});
