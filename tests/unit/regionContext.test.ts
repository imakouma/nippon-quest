import { describe, expect, it } from 'vitest';
import { NQ } from '../../src/rendering/palette';
import { drawRegionContext } from '../../src/ui/field/regionContext';

describe('県地図の周辺県レイヤー', () => {
  it('現在県は描かず、周辺県だけを暗く描く', () => {
    const fills: Array<{ color: string; x: number }> = [];
    const context = {
      fillStyle: '',
      fillRect(x: number) {
        fills.push({ color: this.fillStyle, x });
      },
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;

    drawRegionContext(
      canvas,
      { width: 2, height: 1, rows: ['ab'], areas: [{ capital: [0, 0] }, { capital: [1, 0] }], here: 0 },
      4,
    );

    expect(fills).not.toContainEqual({ color: NQ.night, x: 0 });
    expect(fills).toContainEqual({ color: NQ.night, x: 4 });
  });
});
