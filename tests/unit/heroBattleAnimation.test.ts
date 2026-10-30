import { describe, expect, it } from 'vitest';
import {
  HERO_BATTLE_SEQUENCES,
  HERO_H,
  HERO_W,
  battleFrames,
  heroLook,
} from '../../src/rendering/characters';
import { COSTUME_ART } from '../../src/rendering/costumes';
import { NQ48 } from '../../src/rendering/palette';

const appearances = [
  { hair: 0, skin: 0, cloth: 0 },
  { hair: 7, skin: 6, cloth: 9, hairStyle: 3, eyes: 2 },
] as const;

describe('主人公のバトル用ドットアニメーション', () => {
  it('待機中は足だけでなく上半身のドットも動く', () => {
    const frames = battleFrames(heroLook(appearances[0]));
    const upperBodyPixels = HERO_BATTLE_SEQUENCES.idle.map((index) =>
      JSON.stringify(frames[index]!.slice(0, 26)),
    );

    expect(new Set(upperBodyPixels).size).toBeGreaterThan(1);
  });

  it.each(Object.entries(HERO_BATTLE_SEQUENCES))(
    '%s は位置移動だけでなく複数のドット絵を使う',
    (_name, sequence) => {
      const frames = battleFrames(heroLook(appearances[0]));
      const pixels = sequence.map((index) => JSON.stringify(frames[index]));

      expect(sequence.length).toBeGreaterThan(1);
      expect(new Set(pixels).size).toBeGreaterThan(1);
    },
  );

  it('全見た目・全装備で24×32、透明、NQ-48パレットを保つ', () => {
    const equipmentSets = [{}, ...Object.entries(COSTUME_ART).map(([id, art]) => ({ [art.slot]: id }))];
    const palette = new Set<string>(NQ48);

    for (const appearance of appearances) {
      for (const equipment of equipmentSets) {
        const frames = battleFrames(heroLook(appearance, equipment));
        for (const sequence of Object.values(HERO_BATTLE_SEQUENCES)) {
          for (const index of sequence) {
            const frame = frames[index];
            expect(frame, `frame ${index}`).toBeDefined();
            expect(frame).toHaveLength(HERO_H);
            expect(frame!.every((row) => row.length === HERO_W)).toBe(true);
            expect(frame!.some((row) => row.includes(null))).toBe(true);
            expect(frame!.flat().every((color) => color === null || palette.has(color))).toBe(true);
          }
        }
      }
    }
  });
});
