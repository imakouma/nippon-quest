import { afterEach, describe, expect, it, vi } from 'vitest';
import { NQ48 } from '../../src/rendering/palette';
import { buildTownTreeTexture } from '../../src/rendering/overworld/townTreeArt';
import { townTrees } from '../../src/rendering/overworld/townTrees';

afterEach(() => vi.unstubAllGlobals());

describe('町の木の表示位置', () => {
  it('通常木だけを足元座標と元decorの除外位置に対応させる', () => {
    const decor = Object.freeze([0, 32, 31, 32, 34, 0]);
    expect(townTrees(decor, 3)).toEqual([
      { index: 1, x: 24, y: 15, depth: 8, texture: 'town-tree-round' },
      { index: 3, x: 8, y: 31, depth: 24, texture: 'town-tree-round' },
    ]);
    expect(decor).toEqual([0, 32, 31, 32, 34, 0]);
  });

  it('木のないdecorは変更対象を返さない', () => {
    expect(townTrees([0, 31, 34], 3)).toEqual([]);
  });

  it.each([
    [69, 'town-tree-pine'],
    [70, 'town-tree-snow-pine'],
    [71, 'town-tree-palm'],
    [72, 'town-tree-sakura'],
    [73, 'town-tree-bamboo'],
  ])('樹種 %i の足元と原画を保持する', (tile, texture) => {
    expect(townTrees([tile], 1)).toEqual([{ index: 0, x: 8, y: 15, depth: 8, texture }]);
  });

  it('樹種の原画は16×24内の整数座標とパレットで描かれ、再生成しない', () => {
    const draws: { color: string; rect: number[] }[] = [];
    const context = {
      fillStyle: '',
      fillRect(...rect: number[]) {
        draws.push({ color: this.fillStyle, rect });
      },
    };
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => context }) });
    const keys = new Set<string>();
    const textures = { exists: (key: string) => keys.has(key), addCanvas: (key: string) => keys.add(key) };
    const scene = { textures } as unknown as Parameters<typeof buildTownTreeTexture>[0];
    buildTownTreeTexture(scene);
    expect(keys.size).toBe(6);
    expect(draws.length).toBeGreaterThan(0);
    for (const {
      color,
      rect: [x, y, width, height],
    } of draws) {
      expect(NQ48).toContain(color);
      expect([x, y, width, height].every(Number.isInteger)).toBe(true);
      expect(x! >= 0 && y! >= 0 && x! + width! <= 16 && y! + height! <= 24).toBe(true);
    }
    const count = draws.length;
    buildTownTreeTexture(scene);
    expect(draws).toHaveLength(count);
  });
});
