import { describe, expect, it } from 'vitest';
import {
  TOWN_FARM_TILE,
  TOWN_ROOF_START,
  TOWN_SHOP_START,
  townView,
} from '../../src/rendering/overworld/townView';

const grid = (rows: number[][]) => rows.flat();

describe('町の地面の表示写像', () => {
  it.each([
    [
      'L字',
      [
        [5, 1, 1],
        [15, 5, 1],
        [1, 1, 1],
      ],
    ],
    [
      'T字',
      [
        [1, 5, 1],
        [5, 15, 5],
        [1, 1, 1],
      ],
    ],
    [
      '細道',
      [
        [1, 5, 1],
        [1, 15, 1],
        [1, 5, 1],
      ],
    ],
    [
      'マップ端',
      [
        [5, 15, 5],
        [1, 1, 1],
        [1, 1, 1],
      ],
    ],
  ])('%sの石畳を欠けずに表示する', (_name, rows) => {
    const background = grid(rows);
    const view = townView(background, 3, 3);

    expect(view).toHaveLength(background.length);
    for (const [index, tile] of background.entries()) {
      if (tile === 5 || tile === 15) expect(view[index]).toBeGreaterThanOrEqual(0);
    }
  });

  it('同じ入力では同じ結果になり、入力配列は変わらない', () => {
    const background = Object.freeze(
      grid([
        [1, 5, 15],
        [1, 1, 5],
      ]),
    );
    const original = [...background];

    expect(townView(background, 3, 2)).toEqual(townView(background, 3, 2));
    expect(background).toEqual(original);
  });

  it('未知の番号は元の表示に戻す', () => {
    expect(townView([999], 1, 1)).toEqual([-1]);
  });

  it('石畳の2種類をつなげ、隣接しない辺だけを路肩にする', () => {
    const view = townView(
      grid([
        [1, 5, 1],
        [15, 5, 1],
        [1, 1, 1],
      ]),
      3,
      3,
    );
    expect(view[4]).toBe(1 | 8);
    expect(townView([5], 1, 1)).toEqual([15]);
  });

  it('屋根は同じ色だけをつなぎ、隣の別色とは区別する', () => {
    const view = townView(
      grid([
        [1, 1, 1],
        [6, 6, 16],
        [1, 1, 1],
      ]),
      3,
      3,
    );
    expect(view[3]).toBe(TOWN_ROOF_START + 2);
    expect(view[4]).toBe(TOWN_ROOF_START + 8);
    expect(view[5]).toBe(TOWN_ROOF_START + 16);
  });

  it('単独と2×2屋根の四辺を正しく判定する', () => {
    expect(
      townView(
        grid([
          [1, 1, 1],
          [1, 6, 1],
          [1, 1, 1],
        ]),
        3,
        3,
      )[4],
    ).toBe(TOWN_ROOF_START);
    const view = townView(
      grid([
        [1, 1, 1, 1],
        [1, 6, 6, 1],
        [1, 6, 6, 1],
        [1, 1, 1, 1],
      ]),
      4,
      4,
    );
    expect([view[5], view[6], view[9], view[10]]).toEqual([
      TOWN_ROOF_START + 6,
      TOWN_ROOF_START + 12,
      TOWN_ROOF_START + 3,
      TOWN_ROOF_START + 9,
    ]);
  });

  it('屋根の切り欠きは街の地面に応じて変わる', () => {
    const grass = townView([1, 6, 1], 3, 1)[1];
    const snow = townView([61, 6, 61], 3, 1)[1];
    const sand = townView([63, 6, 63], 3, 1)[1];
    expect(new Set([grass, snow, sand]).size).toBe(3);
  });

  it('屋根の切り欠きは町全体の多数派より近くの舗装を優先する', () => {
    const background = grid([
      [1, 1, 1, 1, 1],
      [1, 5, 5, 5, 1],
      [1, 5, 6, 5, 1],
      [1, 5, 5, 5, 1],
      [1, 1, 1, 1, 1],
    ]);
    const paved = townView(background, 5, 5)[12];
    const grass = townView([1, 6, 1], 3, 1)[1];
    expect(paved).not.toBe(grass);
  });

  it('入口の直南の石畳だけを店先にする', () => {
    const background = Object.freeze([1, 21, 1, 5, 5, 5, 1, 1, 1]);
    const decor = Object.freeze([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const result = townView(background, 3, 3, decor);
    expect(result[4]).toBe(TOWN_SHOP_START + 10);
    expect(result[3]).toBeLessThan(TOWN_SHOP_START);
    expect(background[4]).toBe(5);
    expect(decor[4]).toBe(0);
  });

  it('透過の果樹とぶどう棚の下だけに畑の地面を表示する', () => {
    const background = Object.freeze([1, 1, 1, 1]);
    const decor = Object.freeze([31, 77, 78, 129]);
    const result = townView(background, 4, 1, decor);
    expect(result.slice(0, 2)).toEqual([TOWN_FARM_TILE, TOWN_FARM_TILE]);
    expect(result[2]).not.toBe(TOWN_FARM_TILE);
    expect(result[3]).not.toBe(TOWN_FARM_TILE);
    expect(decor).toEqual([31, 77, 78, 129]);
  });
});
