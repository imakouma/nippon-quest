import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
const questions = readdirSync('content/questions/sansu/g2').flatMap(
  (d) =>
    JSON.parse(readFileSync(`content/questions/sansu/g2/${d}/set-001.json`, 'utf8')) as {
      id: string;
      type: string;
      explanation?: string;
    }[],
);
const audit = JSON.parse(readFileSync('tasks/sansu-g2-balance-20261117.json', 'utf8')) as {
  levels: Record<string, string>;
  groups: { id: string; judgment: string; gaps: string[]; addedIds: string[] }[];
};
const order = JSON.parse(readFileSync('content/review/sansu-g2-order.json', 'utf8')) as {
  groups: { id: string; name: string; questionIds: string[] }[];
};
describe('Grade 2 content balance', () => {
  it('classifies all identities and separates generators from fixed questions', () => {
    expect(Object.keys(audit.levels).sort()).toEqual(questions.map((q) => q.id).sort());
    for (const q of questions) {
      expect(['basic', 'standard', 'advanced', 'generated']).toContain(audit.levels[q.id]);
      expect(audit.levels[q.id] === 'generated', q.id).toBe(q.type === 'random-calculation');
    }
  });
  it('documents group-level decisions and includes every supplement exactly once', () => {
    expect(audit.groups.map((g) => g.id)).toEqual(order.groups.map((g) => g.id));
    const added = audit.groups.flatMap((g) => g.addedIds);
    expect(new Set(added).size).toBe(12);
    expect(added.sort()).toEqual(
      questions
        .filter((q) => q.id.startsWith('sansu.g2.balance.'))
        .map((q) => q.id)
        .sort(),
    );
    for (const g of audit.groups) {
      expect(g.judgment.length).toBeGreaterThan(20);
      for (const id of g.addedIds) {
        expect(order.groups.find((o) => o.id === g.id)!.questionIds).toContain(id);
        expect(g.gaps.length).toBeGreaterThan(0);
        expect(questions.find((q) => q.id === id)!.explanation!.length).toBeGreaterThan(30);
      }
    }
  });
  it('preserves the entire baseline relative order while inserting supplements', () => {
    const original = {
      groups: order.groups.map((g) => ({
        ...g,
        questionIds: g.questionIds.filter((id) => !id.startsWith('sansu.g2.balance.')),
      })),
    };
    expect(createHash('sha256').update(JSON.stringify(original)).digest('hex')).toBe(
      '70631e454099e4c5c462da6185e9be9f5bbc20330793d7b7fb838c64567ea649',
    );
  });
});
