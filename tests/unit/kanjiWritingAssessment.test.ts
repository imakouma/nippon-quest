import { describe, expect, it, vi } from 'vitest';
import grades from '../../content/i18n/kanji-grades.json';
import { assessWriting, gradeOneWriting } from '../../src/questions/renderers/kanji-trace/writingAssessment';

vi.spyOn(console, 'log').mockImplementation(() => undefined);
const ink = (kanji: string) => gradeOneWriting[kanji]!.map((stroke) => stroke.points);

describe('grade-one handwriting assessment', () => {
  it('covers all 80 characters and recognizes their reference strokes', () => {
    expect(Object.keys(gradeOneWriting).sort()).toEqual([...grades.byGrade['1']].sort());
    for (const kanji of grades.byGrade['1']) {
      expect(assessWriting(kanji, ink(kanji)), kanji).toMatchObject({
        score: 1,
        recognized: kanji,
        issue: null,
      });
    }
  });
  it('accepts small position shifts without accepting a different character', () => {
    for (const kanji of ['音', '木', '水', '一']) {
      const shifted = ink(kanji).map((s) => s.map((p) => ({ x: p.x + 0.015, y: p.y - 0.01 })));
      expect(assessWriting(kanji, shifted).score, kanji).toBe(1);
    }
    expect(assessWriting('木', ink('水')).score).toBeLessThan(1);
    expect(assessWriting('日', ink('目')).issue).toBe('count');
  });
  it('accepts mild synthetic wobble and size variation across all 80 characters', () => {
    // Generated perturbations exercise tolerance; these are not children's handwriting samples.
    for (const kanji of grades.byGrade['1']) {
      for (const scale of [0.96, 1.04]) {
        const strokes = ink(kanji).map((stroke) =>
          stroke.map((point, index) => ({
            x: 0.5 + (point.x - 0.5) * scale + 0.004 * Math.sin((index / 63) * Math.PI * 2),
            y: 0.5 + (point.y - 0.5) * scale + 0.004 * Math.sin((index / 63) * Math.PI * 2),
          })),
        );
        expect(assessWriting(kanji, strokes).score, `${kanji} scale=${scale}`).toBe(1);
      }
    }
  });
  it('rejects reversed direction and swapped strokes even when the final picture is identical', () => {
    for (const kanji of ['音', '木', '水', '一']) {
      expect(
        assessWriting(
          kanji,
          ink(kanji).map((s) => [...s].reverse()),
        ).score,
        kanji,
      ).toBeLessThan(1);
    }
    const strokes = ink('木');
    expect(assessWriting('木', [strokes[1]!, strokes[0]!, ...strokes.slice(2)]).issue).toBe('order');
  });
  it('rejects missing/extra strokes, blank, dots, invalid coordinates and a filled square', () => {
    const strokes = ink('音');
    expect(assessWriting('音', strokes.slice(1)).issue).toBe('count');
    expect(assessWriting('音', [...strokes, strokes[0]!]).issue).toBe('count');
    expect(assessWriting('一', []).score).toBe(0);
    expect(
      assessWriting('一', [
        [
          { x: 0.5, y: 0.5 },
          { x: 0.5, y: 0.5 },
        ],
      ]).score,
    ).toBe(0);
    expect(
      assessWriting('一', [
        [
          { x: NaN, y: 0.5 },
          { x: 1, y: 1 },
        ],
      ]).score,
    ).toBe(0);
    expect(
      assessWriting('一', [
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
      ]).score,
    ).toBe(0);
  });
  it('accepts independently drawn simple strokes and rejects an omitted hook', () => {
    expect(
      assessWriting('一', [
        [
          { x: 0.11, y: 0.49 },
          { x: 0.3, y: 0.48 },
          { x: 0.6, y: 0.46 },
          { x: 0.88, y: 0.46 },
        ],
      ]).score,
    ).toBe(1);
    expect(
      assessWriting('山', [
        [
          { x: 0.48, y: 0.15 },
          { x: 0.5, y: 0.2 },
          { x: 0.5, y: 0.74 },
        ],
        [
          { x: 0.2, y: 0.5 },
          { x: 0.21, y: 0.76 },
          { x: 0.8, y: 0.73 },
        ],
        [
          { x: 0.82, y: 0.45 },
          { x: 0.82, y: 0.65 },
          { x: 0.81, y: 0.8 },
        ],
      ]).score,
    ).toBe(1);
    const water = ink('水');
    const withoutHook = [water[0]!.slice(0, 55), ...water.slice(1)];
    expect(assessWriting('水', withoutHook).issue).toBe('ending');
  });
  it('does not give full credit to a missing hook or truncated sweep', () => {
    for (const kanji of ['水', '子', '木']) {
      const strokes = ink(kanji).map((s) => s.slice(0, Math.floor(s.length * 0.75)));
      expect(assessWriting(kanji, strokes).score, kanji).toBeLessThan(1);
    }
  });
});
