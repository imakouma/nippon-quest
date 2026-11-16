// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { questionBaseSchema } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';
const questions = readdirSync('content/questions/sansu/g6').flatMap((unit) =>
  readdirSync(`content/questions/sansu/g6/${unit}`).flatMap((file) =>
    (JSON.parse(readFileSync(`content/questions/sansu/g6/${unit}/${file}`, 'utf8')) as unknown[]).map((q) =>
      questionBaseSchema.parse(q),
    ),
  ),
);
it('keeps explanations self-contained without unsupported cancellation commands', () => {
  for (const q of questions) {
    expect(q.explanation?.length, q.id).toBeGreaterThan(15);
    expect(q.explanation, q.id).not.toMatch(/\\(?:require|bcancel)|動画を見/);
    expect(getRenderer(q.type)!.schema.safeParse(q.payload).success, q.id).toBe(true);
  }
});
it('states the scale question in the unit actually calculated', () => {
  const q = questions.find((q) => q.id.endsWith('45ef7b9abd0f'))!;
  expect((q.payload as { prompt: string }).prompt).toContain('さをcmで');
});
it('orders all 209 questions once and teaches circle area before volume', () => {
  const order = JSON.parse(readFileSync('content/review/sansu-g6-order.json', 'utf8')) as {
    groups: { id: string; questionIds: string[] }[];
  };
  const ids = order.groups.flatMap((g) => g.questionIds);
  expect(questions).toHaveLength(209);
  expect(new Set(ids).size).toBe(ids.length);
  expect([...ids].sort()).toEqual(questions.map((q) => q.id).sort());
  const groups = order.groups.map((g) => g.id);
  expect(groups.indexOf('circle-area')).toBeLessThan(groups.indexOf('volume'));
  expect(groups.indexOf('fraction-integers')).toBeLessThan(groups.indexOf('fraction-division'));
  expect(questions.filter((q) => q.tags?.includes('source:original-curriculum-review'))).toHaveLength(16);
});
it('corrects ratio arithmetic and explains even-count medians', () => {
  expect(questions.find((q) => q.id.endsWith('53b644ac1706'))!.explanation).toContain('14÷7＝2');
  expect(questions.find((q) => q.id.endsWith('9197a4c0b137'))!.explanation).toContain('3番目');
  expect(
    (questions.find((q) => q.id.endsWith('median-even'))!.payload as { choices: { text: string }[] })
      .choices[0]!.text,
  ).toContain('4.5');
});
