import { describe, expect, it } from 'vitest';
import { colorsOf } from '../../src/rendering/monsters/design';
import { NQ48 } from '../../src/rendering/palette';
import { FX_KINDS, fxGrid } from '../../src/rendering/battle/fxArt';

describe('バトルの エフェクトの ドット絵（docs/06 §2.3）', () => {
  it('どれも 絵が あって、色は NQ-48 だけ・6 色まで', () => {
    for (const kind of FX_KINDS) {
      const g = fxGrid(kind);
      const cs = colorsOf(g);
      expect(cs.size, kind).toBeGreaterThan(0);
      expect(cs.size, kind).toBeLessThanOrEqual(6);
      for (const c of cs) expect(NQ48, `${kind}: ${c}`).toContain(c);
    }
  });

  it('文字の 地図の 行は どれも 同じ 長さ（ずれた 絵に ならない）', () => {
    for (const kind of FX_KINDS) {
      const g = fxGrid(kind);
      for (const row of g) expect(row.length, kind).toBe(g[0]!.length);
    }
  });
});
