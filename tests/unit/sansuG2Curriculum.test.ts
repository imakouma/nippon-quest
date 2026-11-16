import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Q = {
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
const questions: Q[] = readdirSync('content/questions/sansu/g2').flatMap((dir) =>
  JSON.parse(readFileSync(`content/questions/sansu/g2/${dir}/set-001.json`, 'utf8')),
);
const order = JSON.parse(readFileSync('content/review/sansu-g2-order.json', 'utf8')) as {
  groups: { id: string; questionIds: string[] }[];
};
describe('Grade 2 curriculum repairs', () => {
  it('places every question once in an explicit learning sequence', () => {
    const ids = order.groups.flatMap((g) => g.questionIds);
    expect(ids).toHaveLength(questions.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(questions.map((q) => q.id)));
    expect(order.groups[0]!.id).toBe('data');
    expect(order.groups.findIndex((g) => g.id === 'three-digits')).toBeLessThan(
      order.groups.findIndex((g) => g.id === 'four-digits'),
    );
  });
  it('restores standalone calculations and independently checks their answers', () => {
    let checked = 0;
    for (const q of questions) {
      const t = q.payload.template?.replace(/\s/g, '');
      if (!t || !/^\d+(?:[+×-]\d+)+=\{\{INPUT\}\}$/.test(t)) continue;
      const parts = t.split('=')[0]!.split(/([+×-])/);
      let total = Number(parts[0]);
      for (let i = 1; i < parts.length; i += 2)
        total =
          parts[i] === '+'
            ? total + Number(parts[i + 1])
            : parts[i] === '-'
              ? total - Number(parts[i + 1])
              : total * Number(parts[i + 1]);
      expect(q.payload.answers, q.id).toEqual([String(total)]);
      checked++;
    }
    expect(checked).toBeGreaterThan(70);
  });
  it('has interpretable explanations and evidence in all fixed questions', () => {
    for (const q of questions.filter((q) => q.type !== 'random-calculation')) {
      expect(q.explanation?.length, q.id).toBeGreaterThan(12);
      expect(q.explanation, q.id).not.toMatch(/\\require|\\bcancel/);
      if (/^つぎの[ けい算ざん[\]]+.*しましょう。$/.test(q.payload.prompt))
        expect(q.payload.template, q.id).toBeTruthy();
    }
  });
  it('keeps equal partition and inverse reasoning in the new material', () => {
    expect(questions.find((q) => q.id === 'sansu.g2.curriculum.equal-halves')?.explanation).toContain(
      '同[おな]じ 大[おお]きさ',
    );
    expect(questions.find((q) => q.id === 'sansu.g2.curriculum.inverse-sub')?.explanation).toContain(
      '23−8＝15',
    );
  });
});
