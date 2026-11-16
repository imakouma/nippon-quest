// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { questionBaseSchema } from '../../src/questions/contracts';
import { questionHasAnswerContext } from '../../src/questions/engine/questionQuality';
import { getRenderer } from '../../src/questions/renderers/registry';
const questions = readdirSync('content/questions/sansu/g4').flatMap((dir) =>
  readdirSync(`content/questions/sansu/g4/${dir}`).flatMap((file) =>
    (JSON.parse(readFileSync(`content/questions/sansu/g4/${dir}/${file}`, 'utf8')) as unknown[]).map((q) => {
      const parsed = questionBaseSchema.parse(q);
      return { ...parsed, payload: parsed.payload };
    }),
  ),
);
const order = JSON.parse(readFileSync('content/review/sansu-g4-order.json', 'utf8')) as {
  groups: { id: string; questionIds: string[] }[];
};
describe('grade 4 curriculum review', () => {
  it('orders every question exactly once and keeps explanations and renderer contracts', () => {
    const ids = order.groups.flatMap((g) => g.questionIds);
    expect(ids).toHaveLength(377);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(questions.map((q) => q.id)));
    for (const q of questions) {
      expect(q.explanation?.length, q.id).toBeGreaterThan(15);
      expect(questionHasAnswerContext(q), q.id).toBe(true);
      expect(getRenderer(q.type)!.schema.safeParse(q.payload).success, q.id).toBe(true);
    }
  });
  it('restores source operands, including decimal and division scales', () => {
    for (const [hash, expression] of [
      ['0d3c0799e490', '0.4×2'],
      ['3067e6e62169', '6.74×29'],
      ['0e2787ecd5a4', '300÷3'],
      ['059ff8d0c43f', '9.12-3.45'],
      ['0194f6e1fbb5', '12÷32'],
      ['41e217e934d3', '11.5÷12'],
    ]) {
      expect((questions.find((q) => q.id.endsWith(hash!))!.payload as { prompt: string }).prompt).toContain(
        expression,
      );
    }
  });
  it('keeps large-number distractors numerically distinct', () => {
    const scale: Record<string, number> = { 兆: 1e12, 億: 1e8, 万: 1e4, '': 1 };
    for (const hash of ['2b9e14a26b41', '3fb16c7f41ee', 'cc5c9901b385']) {
      const q = questions.find((q) => q.id.endsWith(hash))!;
      const payload = q.payload as { choices: { text: string }[] };
      const numbers = payload.choices.map((c) =>
        [...c.text.matchAll(/(\d+)(兆|億|万)?/g)].reduce(
          (sum, m) => sum + Number(m[1]) * scale[m[2] ?? '']!,
          0,
        ),
      );
      expect(new Set(numbers).size, hash).toBe(numbers.length);
    }
  });
  it('places foundational decimal concepts before soroban and decimal operations', () => {
    const ids = order.groups.map((g) => g.id);
    expect(ids.indexOf('decimal-place')).toBeLessThan(ids.indexOf('soroban'));
    expect(ids.indexOf('soroban')).toBeLessThan(ids.indexOf('unit-12'));
    expect(questions.filter((q) => q.tags?.includes('source:original-curriculum-review'))).toHaveLength(12);
  });
});
