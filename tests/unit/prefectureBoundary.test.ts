import { describe, expect, it } from 'vitest';
import { paintPrefectureBorders } from '../../scripts/maps/prefectureBoundary';
import { PREFECTURE_BORDER_TILE } from '../../src/core/world/ground';

describe('paintPrefectureBorders', () => {
  it('斜めに接する県境の草側を一マスだけ石でつなぐ', () => {
    const background = [0, 1, 1, 1];

    paintPrefectureBorders({ width: 2, height: 2, rows: ['rx', 'xx'] }, background, []);

    expect(background).toEqual([0, PREFECTURE_BORDER_TILE, PREFECTURE_BORDER_TILE, PREFECTURE_BORDER_TILE]);
  });

  it('斜めの補間で二層の石垣を作らない', () => {
    const background = [0, 1, 1, 0, ...Array<number>(12).fill(1)];

    paintPrefectureBorders({ width: 4, height: 4, rows: ['rxxr', 'xxxx', 'xxxx', 'xxxx'] }, background, []);

    expect(background[5]).toBe(PREFECTURE_BORDER_TILE);
    expect(background[6]).toBe(1);
  });
});
