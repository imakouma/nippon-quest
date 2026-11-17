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
    expect(ids).toHaveLength(379);
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
  it('gives all 374 fixed questions a readable explanation without broken TeX', () => {
    const fixed = questions.filter((q) => q.type !== 'random-calculation');
    expect(fixed).toHaveLength(374);
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

describe('grade 3 reaudit regressions', () => {
  it('answers the requested multiplication table, rather than its quotient', () => {
    for (const [hash, table] of [
      ['3ee206088b50', '5'],
      ['baebd85bbe9b', '3'],
    ] as const) {
      const q = questions.find((q) => q.id.endsWith(hash))!;
      expect(strip(q.explanation!)).toContain(table + 'のだん');
    }
  });
  it('covers grouping, seconds, route/distance, tools and larger abacus positions', () => {
    for (const [suffix, answer] of [
      ['grouping', '4ふくろ'],
      ['seconds', '80秒'],
      ['route', '700m'],
      ['distance', '500m'],
      ['instrument', 'まきじゃく'],
      ['abacus-large', '23000'],
    ] as const) {
      const q = byId.get('sansu.g3.reaudit.' + suffix)!;
      const actual = strip(q.payload.choices!.find((c) => c.id === q.payload.answer)!.text);
      expect(actual).toBe(answer);
    }
    expect(strip(questions.find((q) => q.id.endsWith('4220df7a294c'))!.explanation!)).toContain('0も 整数');
  });
});

describe('grade 3 triangle classification diagram', () => {
  it('states the equilateral exclusion and gives the scalene triangle distinct side lengths', () => {
    const q = questions.find((q) => q.id.endsWith('dc5ffaf17483'))!;
    expect(strip(q.payload.prompt)).toContain('正三角形を のぞいた');
    const svg = readFileSync('assets/questions/sansu/g3/reaudit/triangle-classification.svg', 'utf8');
    for (const length of ['3cm', '4cm', '5cm']) expect(svg).toContain(length);
    expect(svg.match(/<polygon /g)).toHaveLength(6);
    expect(svg.match(/stroke="#a54022"/g)).toHaveLength(12);
  });
});
