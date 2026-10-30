import { describe, expect, it } from 'vitest';
import { townTrees } from '../../src/rendering/overworld/townTrees';

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
});
