import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import audit from '../../tasks/sansu-g3-balance-20261117.json';
import order from '../../content/review/sansu-g3-order.json';
import { questionBaseSchema } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';

const questions = readdirSync('content/questions/sansu/g3').flatMap((dir) =>
  readdirSync(`content/questions/sansu/g3/${dir}`)
    .filter((file) => file.endsWith('.json'))
    .flatMap((file) => JSON.parse(readFileSync(`content/questions/sansu/g3/${dir}/${file}`, 'utf8'))),
);
const plain = (s: string) => s.replace(/\[[^\]]+\]/g, '');
const additions = questions.filter((q) => q.id.startsWith('sansu.g3.balance.'));
const answer = (key: string) => {
  const q = additions.find((q) => q.id === `sansu.g3.balance.${key}`)!;
  return plain(q.payload.choices.find((c: { id: string }) => c.id === q.payload.answer)!.text);
};

describe('grade 3 balance supplement', () => {
  it('classifies every question once and reports each group with matching counts', () => {
    const levels: Record<string, string> = audit.levels;
    expect(new Set(Object.keys(levels))).toEqual(new Set(questions.map((q) => q.id)));
    expect(additions).toHaveLength(12);
    expect(audit.baseline).toBe('30f9ffc486cc11a7761c3d685ac26a99749f159a');
    for (const g of order.groups) {
      const row = audit.groups.find((r) => r.id === g.id)!;
      const counts: Record<string, number> = {};
      for (const id of g.questionIds) counts[levels[id]] = (counts[levels[id]] ?? 0) + 1;
      expect(counts, g.id).toEqual(row.afterCounts);
      expect(row.judgment).toBeTruthy();
      expect(row.addedIds).toEqual(g.questionIds.filter((id) => id.startsWith('sansu.g3.balance.')));
    }
  });
  it('validates each new payload and its reasoned explanation', () => {
    for (const q of additions) {
      expect(questionBaseSchema.safeParse(q).success, q.id).toBe(true);
      expect(getRenderer(q.type)!.schema.safeParse(q.payload).success, q.id).toBe(true);
      expect(plain(q.explanation).length, q.id).toBeGreaterThan(45);
      expect(new Set(q.payload.choices.map((c: { text: string }) => plain(c.text))).size).toBe(3);
    }
  });
  it('independently checks the quantities, inverse check and partial products', () => {
    expect(answer('books-total')).toBe(`${348 + 275}さつ`);
    expect(answer('notebooks-cost')).toBe(`${124 * 3}円`);
    expect(answer('share-paper')).toBe(`${84 / 4}まい`);
    expect(answer('division-fraction')).toBe(`3分の1で、${60 / 3}cm`);
    expect(answer('chairs')).toBe(`${24 * 13}こ`);
    expect(answer('ribbon-length')).toBe(`5分の${2 + 1}m`);
    expect(answer('water-needed')).toBe(`${(13 - 7) / 10}L`);
    expect(answer('scale-reading')).toBe(`${100 + ((200 - 100) / 5) * 3}g`);
    expect(answer('subtraction-check')).toBe('425+178が503になるか 調べる');
    expect(325 + 178).toBe(503);
    expect(425 + 178).not.toBe(503);
    expect(32 * 14).toBe(128 + 320);
    expect(25 * (4 * 3)).toBe(25 * 4 * 3);
    expect(48 + 27).toBe(50 + 25);
  });
  it('places the pointer on the third of five equal scale intervals without printing its answer', () => {
    const svg = readFileSync('assets/questions/sansu/g3/balance/scale-160.svg', 'utf8');
    for (const x of [100, 180, 260, 340, 420, 500]) expect(svg).toContain(`M${x} 100V140`);
    expect(svg).toContain('M340 67V98');
    expect(svg).not.toContain('160g');
  });
});
