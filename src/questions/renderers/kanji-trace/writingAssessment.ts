import { GeometryUtil } from 'kanji-recognizer';
import data from '../../../../content/kanji/grade-one-strokes.json';
import type { TracePoint } from './schema';

export interface WritingStroke {
  type: string;
  points: TracePoint[];
}
export const gradeOneWriting: Readonly<Record<string, WritingStroke[]>> = data.characters;
export type WritingIssue = 'count' | 'shape' | 'order' | 'direction' | 'ending';
export interface WritingAssessment {
  score: number;
  recognized: string | null;
  issue: WritingIssue | null;
  stroke: number | null;
}
const distance = (a: TracePoint, b: TracePoint) => Math.hypot(a.x - b.x, a.y - b.y);
const deviation = (a: TracePoint[], b: TracePoint[]) =>
  a.reduce((sum, point, index) => sum + distance(point, b[index]!), 0) / a.length;
const shapeDistance = (a: TracePoint[], b: TracePoint[]) =>
  Math.min(deviation(a, b), deviation(a, [...b].reverse()));

// Stroke order and direction are assessed separately from character identification.
function identify(strokes: TracePoint[][]): string | null {
  const candidates = Object.entries(gradeOneWriting).filter(([, target]) => target.length === strokes.length);
  const ranked = candidates
    .map(([kanji, target]) => {
      const forward = strokes.map((s) => Math.min(...target.map((t) => shapeDistance(s, t.points))));
      const backward = target.map((t) => Math.min(...strokes.map((s) => shapeDistance(s, t.points))));
      return { kanji, error: [...forward, ...backward].reduce((a, b) => a + b, 0) / (strokes.length * 2) };
    })
    .sort((a, b) => a.error - b.error);
  return ranked[0] && ranked[0].error < 0.075 ? ranked[0].kanji : null;
}

export function assessWriting(kanji: string, raw: TracePoint[][]): WritingAssessment {
  const target = gradeOneWriting[kanji];
  const fail = (
    issue: WritingIssue,
    stroke: number | null = null,
    recognized: string | null = null,
  ): WritingAssessment => ({ score: 0, recognized, issue, stroke });
  if (!target || raw.length !== target.length) return fail('count');
  if (
    raw.some(
      (s) =>
        s.length < 2 ||
        s.some(
          (p) => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1,
        ) ||
        GeometryUtil.getPathLength(s) < 0.008,
    )
  )
    return fail('shape');
  const strokes = raw.map((s) => GeometryUtil.resample(s, 64).slice(0, 64));
  const recognized = identify(strokes);
  for (let index = 0; index < strokes.length; index += 1) {
    const drawn = strokes[index]!;
    const expected = target[index]!.points;
    const errors = target.map((t) => shapeDistance(drawn, t.points));
    const nearest = errors.indexOf(Math.min(...errors));
    if (nearest !== index && errors[nearest]! + 0.015 < errors[index]!)
      return fail('order', index + 1, recognized);
    const forward = deviation(drawn, expected);
    if (deviation([...drawn].reverse(), expected) + 0.015 < forward)
      return fail('direction', index + 1, recognized);
    const ratio = GeometryUtil.getPathLength(drawn) / GeometryUtil.getPathLength(expected);
    const match = GeometryUtil.compareStrokes(drawn, expected, {
      startDistThreshold: 0.1,
      translationWeight: 0.5,
      shapeWeight: 0.5,
    });
    if (match > 0.055 || ratio < 0.65 || ratio > 1.4) return fail('shape', index + 1, recognized);
    const end = drawn.at(-1)!;
    const expectedEnd = expected.at(-1)!;
    const tail = { x: end.x - drawn[54]!.x, y: end.y - drawn[54]!.y };
    const referenceTail = { x: expectedEnd.x - expected[54]!.x, y: expectedEnd.y - expected[54]!.y };
    const cosine =
      (tail.x * referenceTail.x + tail.y * referenceTail.y) /
      (Math.hypot(tail.x, tail.y) * Math.hypot(referenceTail.x, referenceTail.y));
    // shortcut: end trajectory checks hooks/sweeps, not pen pressure or calligraphic quality.
    if (distance(end, expectedEnd) > 0.055 || !Number.isFinite(cosine) || cosine < 0.35)
      return fail('ending', index + 1, recognized);
  }
  if (recognized !== kanji) return fail('shape', null, recognized);
  return { score: 1, recognized, issue: null, stroke: null };
}
