/**
 * 人物の仮ドット絵（src/scenes/art/characters.ts）の地図が規格どおりか（docs/06 §4：1 コマ 16×24）。
 * 地図は 14×22 を 16×24 のまん中に置き、外側 1 ドットに輪郭線が付く。
 */
import { describe, expect, it } from 'vitest';
import { CHAR_H, CHAR_MAPS, CHAR_W } from '../../src/scenes/art/characters';
import { NQ48 } from '../../src/scenes/art/palette';

describe('人物の地図', () => {
  const all = [...CHAR_MAPS.tops, ...CHAR_MAPS.caps, ...CHAR_MAPS.legs, ...CHAR_MAPS.parts];

  it('1 行は 14 文字（左右 1 ドットずつ輪郭の余白）', () => {
    for (const rows of all) for (const r of rows) expect(r, r).toHaveLength(CHAR_W - 2);
  });

  it('上半身 17 行 + 足 5 行 = 22 行（上下 1 ドットずつ輪郭の余白）', () => {
    for (const t of CHAR_MAPS.tops) expect(t).toHaveLength(17);
    for (const l of CHAR_MAPS.legs) expect(l).toHaveLength(5);
    expect(17 + 5).toBe(CHAR_H - 2);
  });
});

describe('パレット NQ-48', () => {
  it('48 色・重複なし・#rrggbb', () => {
    expect(NQ48).toHaveLength(48);
    expect(new Set(NQ48).size).toBe(48);
    for (const c of NQ48) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
});
