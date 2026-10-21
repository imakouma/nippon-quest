import { describe, expect, it } from 'vitest';
import { NQ } from '../../src/rendering/palette';
import { drawRegionContext } from '../../src/ui/field/regionContext';

describe('県地図の周辺県レイヤー', () => {
  it('現在県と周辺県の共有境界は陸で埋め、実際の海だけを透明に残す', () => {
    const fills: Array<{ color: string; x: number; y: number; width: number; height: number }> = [];
    const context = {
      fillStyle: '',
      fillRect(x: number, y: number, width: number, height: number) {
        fills.push({ color: this.fillStyle, x, y, width, height });
      },
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;

    drawRegionContext(
      canvas,
      {
        width: 4,
        height: 1,
        rows: ['.ab.'],
        areas: [{ capital: [1, 0] }, { capital: [2, 0] }],
        here: 0,
      },
      4,
    );

    const cells = fills.filter(({ width, height }) => width === 4 && height === 4);
    expect(cells).toContainEqual({ color: NQ.leaf, x: 4, y: 0, width: 4, height: 4 });
    expect(cells).toContainEqual({ color: NQ.night, x: 8, y: 0, width: 4, height: 4 });
    expect(cells.some(({ x }) => x === 0 || x === 12)).toBe(false);
  });

  it('現在県の輪郭は陸で埋め、地方図で海になっているマスだけを透明に残す', () => {
    const fills: Array<{ color: string; x: number; y: number; width: number; height: number }> = [];
    const context = {
      fillStyle: '',
      fillRect(x: number, y: number, width: number, height: number) {
        fills.push({ color: this.fillStyle, x, y, width, height });
      },
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;

    drawRegionContext(
      canvas,
      { width: 3, height: 1, rows: ['.a.'], areas: [{ capital: [1, 0] }], here: 0 },
      4,
    );

    const cells = fills.filter(({ width, height }) => width === 4 && height === 4);
    expect(cells).toEqual([{ color: NQ.leaf, x: 4, y: 0, width: 4, height: 4 }]);
  });
});
