import { readFileSync } from 'node:fs';
import { afterAll, expect, it, vi } from 'vitest';
import grades from '../../content/i18n/kanji-grades.json';
import { assessWriting } from '../../src/questions/renderers/kanji-trace/writingAssessment';
import { loadWriting } from '../../src/questions/renderers/kanji-trace/writingData';

vi.spyOn(console, 'log').mockImplementation(() => undefined);
vi.stubGlobal('fetch', async (url: string) => {
  const grade = url.match(/grade-([2-6])-strokes/)?.[1];
  if (!grade) throw new Error(`Unexpected asset ${url}`);
  return new Response(readFileSync(`content/kanji/grade-${grade}-strokes.json`, 'utf8'));
});
afterAll(() => vi.unstubAllGlobals());

it.each(Object.entries(grades.byGrade))(
  'recognizes every grade %s reference and mild synthetic variation',
  async (_grade, characters) => {
    const data = await loadWriting(characters[0]!);
    expect(Object.keys(data).sort()).toEqual([...characters].sort());
    const rejected: string[] = [];
    for (const kanji of characters) {
      const ink = data[kanji]!.map((stroke) => stroke.points);
      for (const scale of [1, 0.96, 1.04]) {
        const strokes = ink.map((stroke) =>
          stroke.map((p, i) => ({
            x: 0.5 + (p.x - 0.5) * scale + (scale === 1 ? 0 : 0.003 * Math.sin((i / 63) * Math.PI * 2)),
            y: 0.5 + (p.y - 0.5) * scale + (scale === 1 ? 0 : 0.003 * Math.sin((i / 63) * Math.PI * 2)),
          })),
        );
        const result = assessWriting(kanji, strokes, data);
        if (result.score !== 1)
          rejected.push(`${kanji} ${scale}: ${result.issue} ${result.stroke} ${result.recognized}`);
      }
      expect(assessWriting(kanji, ink.slice(1), data).score).toBe(0);
      expect(assessWriting(kanji, [...ink, ink[0]!], data).score).toBe(0);
      expect(
        assessWriting(
          kanji,
          ink.map((s) => [...s].reverse()),
          data,
        ).score,
      ).toBe(0);
    }
    expect(rejected).toEqual([]);
  },
  120000,
);

it.each([
  ['土', '士'],
  ['千', '干'],
  ['天', '夫'],
  ['刀', '力'],
  ['牛', '午'],
  ['右', '石'],
  ['目', '自'],
  ['未', '末'],
  ['田', '由'],
  ['申', '由'],
])('rejects confusable characters %s and %s even across grades', async (a, b) => {
  const left = await loadWriting(a);
  const right = await loadWriting(b);
  expect(
    assessWriting(
      a,
      right[b]!.map((s) => s.points),
      left,
    ).score,
  ).toBe(0);
  expect(
    assessWriting(
      b,
      left[a]!.map((s) => s.points),
      right,
    ).score,
  ).toBe(0);
});
