import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
const questions = readdirSync('content/questions/sansu/g6').flatMap((d) =>
  readdirSync(`content/questions/sansu/g6/${d}`).flatMap((f) =>
    JSON.parse(readFileSync(`content/questions/sansu/g6/${d}/${f}`, 'utf8')),
  ),
);
const audit = JSON.parse(readFileSync('tasks/sansu-g6-balance-20261117.json', 'utf8'));
it('classifies every question and records a reason for each learning group', () => {
  expect(Object.keys(audit.levels).sort()).toEqual(questions.map((q) => q.id).sort());
  expect(audit.groups).toHaveLength(15);
  for (const g of audit.groups) {
    expect(g.judgment.length).toBeGreaterThan(15);
    expect(g.gaps.length).toBeGreaterThan(15);
  }
  expect(questions.filter((q) => q.id.startsWith('sansu.g6.balance.'))).toHaveLength(8);
});
it('uses the quantities and the distinction between ordered and unordered cases correctly', () => {
  const answer = (name: string) => {
    const q = questions.find((q) => q.id === `sansu.g6.balance.${name}`);
    return q.payload.choices.find((c: { id: string }) => c.id === q.payload.answer).text;
  };
  expect((3 / 8) * 4).toBe(3 / 2);
  expect(answer('fraction-packets')).toBe('3/2kg');
  expect(3 / 5 / 3).toBeCloseTo(1 / 5);
  expect(answer('fraction-share')).toBe('1/5L');
  expect(answer('ratio-difference')).toBe(`${(8 / (3 - 2)) * 3}cm`);
  expect(answer('estimate-model')).toBe('3×3×3.14');
  expect(answer('pairs-list')).toBe('BとC');
  expect(answer('pairs-duplicate')).toContain('6÷2＝3');
  expect(answer('symmetry-counterexample')).toContain('正三角形');
  expect(answer('estimate-meaning')).toContain('およその面積');
});
