import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
const questions = readdirSync('content/questions/sansu/g5').flatMap((d) =>
  readdirSync(`content/questions/sansu/g5/${d}`).flatMap((f) =>
    JSON.parse(readFileSync(`content/questions/sansu/g5/${d}/${f}`, 'utf8')),
  ),
) as {
  id: string;
  payload: { choices: { id: string; text: string }[]; answer: string };
  explanation: string;
}[];
const audit = JSON.parse(readFileSync('tasks/sansu-g5-balance-20261117.json', 'utf8')) as {
  levels: Record<string, string>;
  groups: { id: string; baselineIds: string[]; judgment: string; gaps: string; addedIds: string[] }[];
};
const order = JSON.parse(readFileSync('content/review/sansu-g5-order.json', 'utf8')) as {
  groups: { id: string; questionIds: string[] }[];
};
it('classifies all fixed questions with group rationale and preserves the existing order', () => {
  expect(Object.keys(audit.levels).sort()).toEqual(questions.map((q) => q.id).sort());
  for (const level of Object.values(audit.levels))
    expect(['basic', 'standard', 'advanced', 'generated']).toContain(level);
  for (const g of audit.groups) {
    expect(g.judgment.length).toBeGreaterThan(15);
    expect(g.gaps).toBeTruthy();
    const current = order.groups.find((x) => x.id === g.id)!.questionIds;
    expect(current.filter((id) => g.baselineIds.includes(id))).toEqual(g.baselineIds);
    expect(current.filter((id) => !g.baselineIds.includes(id))).toEqual(g.addedIds);
  }
});
it('checks independently calculated contextual answers and complete explanations', () => {
  const expected: Record<string, string> = {
    'hundredth-pieces': `${237 / 100}kg`,
    'reverse-place': `${4.8 / 10}`,
    'ribbon-price': `${80 * 2.5}円`,
    'equal-gift-bags': '6袋',
    'bus-cycle': '24分後',
    'common-multiple-range': '36と48',
    'share-two-litres': '2/3L',
    'combine-water': '5/6L',
    'used-water': '5/12L',
    'triangle-height-inverse': `${(24 * 2) / 8}cm`,
    'apple-box-inverse': `${(980 - 80) / 150}こ`,
    'speed-compare-units': 'Bさん',
  };
  const additions = questions.filter((q) => q.id.startsWith('sansu.g5.balance.'));
  expect(additions).toHaveLength(12);
  for (const q of additions) {
    const answer = q.payload.choices.find((c) => c.id === q.payload.answer)!.text.replace(/\[[^\]]+\]/g, '');
    expect(answer, q.id).toBe(expected[q.id.split('.').at(-1)!]);
    expect(q.explanation.length, q.id).toBeGreaterThan(40);
    expect(new Set(q.payload.choices.map((c) => c.text)).size).toBe(q.payload.choices.length);
  }
  expect(2 * 60).toBeGreaterThan(90);
  expect(24 % 6).toBe(0);
  expect(18 % 6).toBe(0);
  expect(Array.from({ length: 19 }, (_, i) => 31 + i).filter((n) => n % 4 === 0 && n % 6 === 0)).toEqual([
    36, 48,
  ]);
});
