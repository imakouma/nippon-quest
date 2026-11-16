import { expect, it, vi } from 'vitest';
import { assessWriting, gradeOneWriting } from '../../src/questions/renderers/kanji-trace/writingAssessment';

vi.spyOn(console, 'log').mockImplementation(() => undefined);
const ink = (kanji: string) => gradeOneWriting[kanji]!.map((stroke) => stroke.points);

it('rejects a single reversed or duplicated stroke in every grade-one character', () => {
  const accepted: string[] = [];
  for (const kanji of Object.keys(gradeOneWriting)) {
    const strokes = ink(kanji);
    for (let i = 0; i < strokes.length; i++) {
      const reversed = strokes.map((stroke, j) => (i === j ? [...stroke].reverse() : stroke));
      if (assessWriting(kanji, reversed).score === 1) accepted.push(`${kanji}: reversed ${i + 1}`);
      if (strokes.length < 2) continue;
      const duplicate = strokes.map((stroke, j) => (i === j ? strokes[(i + 1) % strokes.length]! : stroke));
      if (assessWriting(kanji, duplicate).score === 1) accepted.push(`${kanji}: duplicate ${i + 1}`);
    }
  }
  expect(accepted).toEqual([]);
});

it('rejects swapped adjacent strokes across all grade-one characters', () => {
  const accepted: string[] = [];
  for (const kanji of Object.keys(gradeOneWriting)) {
    const strokes = ink(kanji);
    for (let i = 0; i < strokes.length - 1; i++) {
      const swapped = [...strokes];
      [swapped[i], swapped[i + 1]] = [swapped[i + 1]!, swapped[i]!];
      if (assessWriting(kanji, swapped).score === 1) accepted.push(`${kanji}: ${i + 1}`);
    }
  }
  expect(accepted).toEqual([]);
});

it.each([
  ['人', '入'],
  ['土', '上'],
  ['木', '天'],
  ['本', '正'],
  ['白', '田'],
])('does not accept similar or same-count characters %s and %s interchangeably', (a, b) => {
  expect(assessWriting(a, ink(b)).score).toBe(0);
  expect(assessWriting(b, ink(a)).score).toBe(0);
});

it.each(['水', '小', '町', '村'])('rejects a shortened hook in %s', (kanji) => {
  const strokes = gradeOneWriting[kanji]!;
  const shortened = strokes.map((stroke) =>
    stroke.type === '㇚' ? stroke.points.slice(0, 55) : stroke.points,
  );
  expect(strokes.some((stroke) => stroke.type === '㇚')).toBe(true);
  expect(assessWriting(kanji, shortened).score).toBe(0);
});
