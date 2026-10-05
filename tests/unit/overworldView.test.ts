import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { overworldView, VIEW, VIEW_COUNT, viewTileAt } from '../../src/scenes/overworld/overworldView';

const MAPS = new URL('../../maps/', import.meta.url);
const grid = (rows: number[][]) => rows.flat();

describe('フィールドの 見た目（overworldView）', () => {
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
