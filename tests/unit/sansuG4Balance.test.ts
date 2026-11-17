import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
const questions = readdirSync('content/questions/sansu/g4').flatMap((dir) =>
  readdirSync(`content/questions/sansu/g4/${dir}`).flatMap((file) =>
    JSON.parse(readFileSync(`content/questions/sansu/g4/${dir}/${file}`, 'utf8')),
  ),
) as { id: string; payload: { answer: string; choices: { id: string; text: string }[] } }[];
const order = JSON.parse(readFileSync('content/review/sansu-g4-order.json', 'utf8')) as {
  groups: { id: string; questionIds: string[] }[];
};
const audit = JSON.parse(readFileSync('tasks/sansu-g4-balance-20261117.json', 'utf8')) as {
  levels: Record<string, string>;
  groups: { id: string; judgment: string; gaps: string[]; addedIds: string[] }[];
};
const strip = (s: string) => s.replace(/\[[^\]]+\]/g, '');
describe('grade four balance additions', () => {
  it('classifies every fixed question and preserves baseline order', () => {
    expect(Object.keys(audit.levels).sort()).toEqual(questions.map((q) => q.id).sort());
    expect(new Set(Object.values(audit.levels))).toEqual(new Set(['basic', 'standard', 'advanced']));
    const baseline = order.groups.map((g) => ({
      id: g.id,
      questionIds: g.questionIds.filter((id) => !id.startsWith('sansu.g4.balance.')),
    }));
    expect(createHash('sha256').update(JSON.stringify(baseline)).digest('hex')).toBe(
      '092913123f36c141d4897e6eb30c53f1f0d96bc75e543f4ae80605e54fbd5949',
    );
    expect(audit.groups.map((g) => g.id)).toEqual(order.groups.map((g) => g.id));
    for (const g of audit.groups) {
      expect(g.judgment.length).toBeGreaterThan(30);
      expect(g.gaps.length).toBeGreaterThan(0);
    }
    expect(audit.groups.flatMap((g) => g.addedIds).sort()).toEqual(
      questions
        .filter((q) => q.id.startsWith('sansu.g4.balance.'))
        .map((q) => q.id)
        .sort(),
    );
  });
  it('keeps independently checked numerical and reasoning answers', () => {
    const expected: Record<string, string> = {
      'large-relative': `${300000000 / 10000000 + 60000000 / 10000000}こ`,
      'division-seat': `${Math.ceil(125 / 8)}台`,
      'division-check': 'あまり7は、わる数4より小さくなく、もう1回分けられるから',
      'decimal-order': '0.8、0.75、0.705',
      'decimal-unit': `${125 / 1}こ`,
      'soroban-large': `${2 + 6}億`,
      'soroban-carry': '10こ分を十分の一のけたの1こ分にかえて、0.55にする',
      'decimal-product-scene': `${(35 * 6) / 100}L`,
      'decimal-product-reason': '0.01が24×3＝72こ分だから、答えは0.72',
      'decimal-remainder': '1人1.8m、残り0.2m',
      'fraction-scene': `${5 - 3}/5L`,
      'relation-reverse': `${(530 - 50) / 120}こ`,
      'graph-between': '14℃くらいと予想できるが、必ず14℃だったとはいえない',
      'angle-combine': `${45 + 60}°`,
    };
    expect(Object.keys(expected)).toHaveLength(14);
    for (const [id, text] of Object.entries(expected)) {
      const q = questions.find((q) => q.id === `sansu.g4.balance.${id}`)!;
      expect(strip(q.payload.choices.find((c) => c.id === q.payload.answer)!.text), id).toBe(text);
      expect(new Set(q.payload.choices.map((c) => strip(c.text))).size, id).toBe(q.payload.choices.length);
    }
  });
});
