import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import order from '../../content/review/sansu-g3-order.json';
import source from '../../tasks/sansu-g3-source-audit.json';

type Question = {
  id: string;
  type: string;
  explanation?: string;
  payload: {
    prompt: string;
    template?: string;
    answers?: string[];
    choices?: { id: string; text: string }[];
    answer?: string;
  };
};
const questions: Question[] = readdirSync('content/questions/sansu/g3').flatMap((dir) =>
  readdirSync(`content/questions/sansu/g3/${dir}`)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(`content/questions/sansu/g3/${dir}/${f}`, 'utf8'))),
);
const byId = new Map(questions.map((q) => [q.id, q]));
const strip = (s: string) => s.replace(/\[[^\]]+\]/g, '');

describe('grade 3 curriculum and recovered source context', () => {
  it('includes every question exactly once, and introduces concepts before applications', () => {
    const ids = order.groups.flatMap((g) => g.questionIds);
    expect(ids).toHaveLength(361);
    expect(new Set(ids)).toEqual(new Set(byId.keys()));
    const groups = order.groups.map((g) => g.id);
    for (const [before, after] of [
      ['division', 'remainder'],
      ['multiply-one', 'multiply-two'],
      ['decimal', 'fraction'],
      ['numbers', 'soroban'],
    ] as const)
      expect(groups.indexOf(before)).toBeLessThan(groups.indexOf(after));
  });
  it('gives all 356 fixed questions a readable explanation without broken TeX', () => {
    const fixed = questions.filter((q) => q.type !== 'random-calculation');
    expect(fixed).toHaveLength(356);
    for (const q of fixed) {
      expect(q.explanation?.length, q.id).toBeGreaterThan(10);
      expect(JSON.stringify(q), q.id).not.toMatch(/\\(?:require|bcancel)\{/);
    }
  });
  it('independently calculates recovered arithmetic from original operands, not stored answers', () => {
    let count = 0;
    for (const entry of source.questions) {
      const q = byId.get(entry.id)!;
      const expression = entry.sourceTemplate
        .replace(/\$|\\r\\n|\s/g, '')
        .replace(/＝/g, '=')
        .replace(/=$/, '');
      const match = expression.match(/^(\d+(?:\.\d+)?)([+×÷-])(\d+(?:\.\d+)?)$/);
      if (!match || q.type !== 'text-input' || q.payload.answers?.length !== 1) continue;
      const [, left, operator, right] = match;
      const a = Number(left),
        b = Number(right);
      const calculated =
        operator === '+' ? a + b : operator === '-' ? a - b : operator === '×' ? a * b : a / b;
      expect(Number(q.payload.answers[0]), entry.id).toBeCloseTo(calculated, 8);
      expect(strip(q.payload.prompt + (q.payload.template ?? '')).replace(/\s/g, ''), entry.id).toContain(
        expression,
      );
      count++;
    }
    expect(count).toBeGreaterThan(100);
  });
  it('replaces degree arithmetic with grade 3 angle equality, with explicit new answers', () => {
    for (const [hash, answer] of [
      ['9c9ecd05ef31', '3'],
      ['ad7e2d83c1a7', '2'],
    ] as const) {
      const q = questions.find((q) => q.id.endsWith(hash))!;
      expect(q.payload.answers).toEqual([answer]);
      expect(q.payload.prompt).toContain('同[おな]じ大[おお]きさの角');
      expect(JSON.stringify(q)).not.toContain('°');
    }
  });
  it('restores original mental-arithmetic operands instead of equivalent-answer inventions', () => {
    for (const [hash, expression] of [
      ['0d0304a60c74', '19+24'],
      ['4abceaa7ea76', '41+18'],
      ['4edb33dd8f60', '42+39'],
      ['b375fc9721b5', '37+53'],
      ['cd8591c437d6', '45+47'],
    ] as const)
      expect(questions.find((q) => q.id.endsWith(hash))!.payload.prompt).toContain(expression);
  });
});
