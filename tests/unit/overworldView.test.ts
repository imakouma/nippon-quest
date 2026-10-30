import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { overworldView, VIEW, VIEW_COUNT, viewTileAt } from '../../src/rendering/overworld/overworldView';

const MAPS = new URL('../../maps/', import.meta.url);
const grid = (rows: number[][]) => rows.flat();

describe('フィールドの 見た目（overworldView）', () => {
  it('4 方向の全マスクで森・砂・道・海の接続を区別する', () => {
    for (let mask = 0; mask < 16; mask++) {
      const neighbors = [1, 5, 7, 3];
      const fixture = (center: number, connected: number[], other: number) => {
        const bg = Array<number>(9).fill(other);
        bg[4] = center;
        neighbors.forEach((index, bit) => {
          if (mask & (1 << bit)) bg[index] = connected[bit % connected.length]!;
        });
        return bg;
      };
      expect(viewTileAt(fixture(149, [149, 150, 11], 1), 3, 3, 4)).toBe(VIEW.FOREST + mask);
      expect(viewTileAt(fixture(163, [163], 999), 3, 3, 4)).toBe(VIEW.ROAD + mask);
      const sand = viewTileAt(fixture(147, [147, 148, 3], 1), 3, 3, 4);
      if (mask === 15) expect([VIEW.SAND, VIEW.SAND2]).toContain(sand);
      else expect(sand).toBe(VIEW.SAND_EDGE + mask);
      const water = viewTileAt(fixture(3, [1, 147, 163, 999], 3), 3, 3, 4);
      if (mask === 0) expect([VIEW.WATER, VIEW.WATER_GLINT]).toContain(water);
      else expect(water).toBe(VIEW.WATER + mask);
    }
  });

  it('外周は同種として扱い、未知番号や空配列は元の表示へ戻す', () => {
    expect(viewTileAt([163], 1, 1, 0)).toBe(VIEW.ROAD + 15);
    expect(viewTileAt([149], 1, 1, 0)).toBe(VIEW.FOREST + 15);
    expect(viewTileAt([0], 1, 1, 0)).toBe(-1);
    expect(overworldView([], 0, 0)).toEqual([]);
    expect(viewTileAt([0, 0, 0, 0, 3, 0, 0, 0, 0], 3, 3, 4)).toBeOneOf([VIEW.WATER, VIEW.WATER_GLINT]);
  });

  it('入力を変更せず、同じ座標の表示を決定的に範囲内へ写す', () => {
    const bg = [
      1, 13, 14, 147, 148, 149, 150, 11, 151, 152, 12, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163,
      3, 301, 999, 0,
    ];
    const original = [...bg];
    const first = overworldView(bg, 13, 2);
    expect(overworldView(bg, 13, 2)).toEqual(first);
    expect(bg).toEqual(original);
    expect(first.every((tile) => tile === -1 || (tile >= 0 && tile < VIEW_COUNT))).toBe(true);
  });

  it('果樹の種類を保ちつつ座標で原画を選ぶ', () => {
    for (const [ground, variants] of [
      [157, [VIEW.ORCHARD, VIEW.ORCHARD_ALT]],
      [158, [VIEW.ORCHARD_PEACH, VIEW.ORCHARD_PEACH_ALT]],
    ] as const) {
      const bg = Array<number>(16).fill(ground);
      expect(new Set(overworldView(bg, 4, 4))).toEqual(new Set(variants));
    }
  });

  it('海は となりが 陸の がわに 波（北 1・東 2・南 4・西 8）', () => {
    expect(
      viewTileAt(
        grid([
          [3, 1, 3],
          [3, 3, 3],
          [3, 3, 3],
        ]),
        3,
        3,
        4,
      ),
    ).toBe(VIEW.WATER + 1);
    expect(
      viewTileAt(
        grid([
          [3, 3, 3],
          [1, 3, 147],
          [3, 3, 3],
        ]),
        3,
        3,
        4,
      ),
    ).toBe(VIEW.WATER + 2 + 8);
  });

  it('森は まわりが ぜんぶ 森なら まん中の 絵（とがった 木は 針葉樹）、森で ない がわは ふち', () => {
    const all = (t: number) => grid([0, 1, 2].map(() => [t, t, t]));
    expect(viewTileAt(all(149), 3, 3, 4)).toBe(VIEW.FOREST + 15);
    expect(viewTileAt(all(150), 3, 3, 4)).toBe(VIEW.FOREST_PINE);
    expect(
      viewTileAt(
        grid([
          [1, 1, 1],
          [149, 149, 1],
          [1, 1, 1],
        ]),
        3,
        3,
        4,
      ),
    ).toBe(VIEW.FOREST + 8);
  });

  it('知らない 番号は -1（もとの 絵を そのまま 出す）', () => {
    expect(viewTileAt([999], 1, 1, 0)).toBe(-1);
  });

  it('県境の石垣には専用の見た目がある', () => {
    expect(viewTileAt([301], 1, 1, 0)).toBe(VIEW.PREFECTURE_BORDER);
  });

  it('県の フィールドと 離島に 使っている タイルは ぜんぶ 見た目が ある', () => {
    for (const f of readdirSync(MAPS).filter((n) => /-(field|enclave)\.json$/.test(n))) {
      const m = JSON.parse(readFileSync(new URL(f, MAPS), 'utf8')) as {
        width: number;
        height: number;
        layers: { name: string; data?: number[] }[];
      };
      const bg = m.layers.find((l) => l.name === 'background')!.data!;
      const view = overworldView(bg, m.width, m.height);
      expect([...new Set(bg.filter((_, i) => view[i]! < 0))], f).toEqual([]);
      expect(
        view.every((v) => v < VIEW_COUNT),
        f,
      ).toBe(true);
    }
  });
});
