import { describe, expect, it } from 'vitest';
import { townView } from '../../src/rendering/overworld/townView';

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
});
