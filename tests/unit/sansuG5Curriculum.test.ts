import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { QuestionBase } from '../../src/questions/contracts';
const questions = readdirSync('content/questions/sansu/g5').flatMap((unit) =>
  readdirSync(`content/questions/sansu/g5/${unit}`).flatMap(
    (file) =>
      JSON.parse(readFileSync(`content/questions/sansu/g5/${unit}/${file}`, 'utf8')) as QuestionBase[],
  ),
);
const find = (suffix: string) => questions.find((q) => q.id.endsWith(suffix))!;
it('restores source expressions without leaking their answers', () => {
  expect(find('1677485ba4e9').payload).toMatchObject({ template: '4.03 × 10 = {{INPUT}}' });
  expect(JSON.stringify(find('1677485ba4e9').payload)).not.toContain('けいさんしましょう (40.3)');
  expect(find('01eb324fd937').payload).toMatchObject({ template: '0.86 × 0.75 = {{INPUT}}' });
  expect(find('0d4019d6f9fd').payload).toMatchObject({ template: '19 ÷ 0.25 = {{INPUT}}' });
});
it('separates fraction input values and keeps the original fraction to solve', () => {
  const p = find('0576dd5e31f4').payload as { answers: string[]; template: string };
  expect(p.answers).toEqual(['3', '250']);
  expect(p.template).toContain('0.012');
  expect(p.template.match(/\{\{INPUT\}\}/g)).toHaveLength(2);
});
it('covers all 353 questions once in learning order, with explanations and valid input slots', () => {
  const order = JSON.parse(readFileSync('content/review/sansu-g5-order.json', 'utf8')) as {
    groups: { questionIds: string[] }[];
  };
  const ids = order.groups.flatMap((g) => g.questionIds);
  expect(questions).toHaveLength(353);
  expect(ids).toHaveLength(353);
  expect(new Set(ids)).toEqual(new Set(questions.map((q) => q.id)));
  for (const q of questions) {
    expect(q.explanation?.length, q.id).toBeGreaterThan(15);
    const p = q.payload as { answers?: string[]; template?: string };
    expect(JSON.stringify(p), q.id).not.toContain('FormInput');
    if (p.answers) {
      expect(
        p.answers.some((a) => a.includes(',')),
        q.id,
      ).toBe(false);
      if (p.template) expect(p.template.match(/\{\{INPUT\}\}/g), q.id).toHaveLength(p.answers.length);
    }
  }
});
it('fills missing conditions in changing quantities and corrects the walking explanation', () => {
  expect((find('1a39e3e1e03b').payload as { prompt: string }).prompt).toContain('8');
  expect((find('83684515e4e8').payload as { prompt: string }).prompt).toContain('8');
  expect(find('7377bc97226a').explanation).toContain('4560×2＝9120');
  expect(find('7377bc97226a').explanation).not.toContain('45600');
});
