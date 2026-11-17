// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import review from '../../scripts/data/sansu-g1-visual-review.json';
import { questionBaseSchema, type QuestionBase } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';

const questions = readdirSync('content/questions/sansu/g1').flatMap((dir) =>
  (JSON.parse(readFileSync(`content/questions/sansu/g1/${dir}/set-001.json`, 'utf8')) as unknown[]).map(
    (q) => questionBaseSchema.parse(q) as QuestionBase,
  ),
);
const changed = review.filter((r) => r.decision === 'illustrated');
describe('grade 1 visual question review', () => {
  it('reviews every question and preserves all learning targets and correct answers', () => {
    expect(questions).toHaveLength(215);
    expect(changed).toHaveLength(98);
    expect(new Set(review.map((r) => r.id))).toEqual(new Set(questions.map((q) => q.id)));
    const rows = questions
      .filter((q) => !q.id.startsWith('sansu.g1.reaudit.'))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((q) => {
        const p = getRenderer(q.type)!.schema.parse(q.payload) as {
          choices?: { id: string; text: string }[];
          answer?: string | number;
          answers?: string[];
        };
        return [
          q.id,
          q.grade,
          q.unit,
          q.type === 'choice'
            ? p.choices!.find((c) => c.id === p.answer)!.text
            : (p.answers ?? [String(p.answer)]),
        ];
      });
    expect(createHash('sha256').update(JSON.stringify(rows)).digest('hex')).toBe(
      '38839a0d6eb1a782a982bbf0c2949c70a177d7f4e07567893c0f597e31b8e405',
    );
  });
  it('uses valid self-contained SVGs with exact object counts and accessible descriptions', () => {
    for (const entry of changed) {
      const q = questions.find((q) => q.id === entry.id)!;
      const p = getRenderer(q.type)!.schema.parse(q.payload) as {
        prompt: string;
        promptImage?: string;
        promptImageAlt?: string;
        promptSpeech?: string;
        choices?: { image?: string }[];
      };
      const paths = [p.promptImage, ...(p.choices ?? []).map((c) => c.image)].filter((p): p is string => !!p);
      expect(paths.length, q.id).toBeGreaterThan(0);
      expect(p.prompt, q.id).not.toMatch(/[●○]/);
      if (p.promptImage) expect(p.promptImageAlt ?? p.promptSpeech, q.id).toBeTruthy();
      expect(p.promptSpeech ?? '', q.id).not.toContain('？。');
      for (const path of paths) {
        const doc = new DOMParser().parseFromString(readFileSync(`assets/${path}`, 'utf8'), 'image/svg+xml');
        expect(doc.querySelector('parsererror'), path).toBeNull();
        expect(doc.querySelector('title')?.textContent, path).toBeTruthy();
        expect(doc.querySelector('script, image'), path).toBeNull();
        for (const use of doc.querySelectorAll('use'))
          expect(doc.getElementById(use.getAttribute('href')!.slice(1)), path).not.toBeNull();
        for (const group of doc.querySelectorAll('[data-count]'))
          expect(group.querySelectorAll('use').length, path).toBe(Number(group.getAttribute('data-count')));
        for (const group of doc.querySelectorAll('[data-ten]'))
          expect(group.querySelectorAll('use').length, path).toBe(10);
        for (const group of doc.querySelectorAll('[data-ones]'))
          expect(group.querySelectorAll('use').length, path).toBe(Number(group.getAttribute('data-ones')));
      }
    }
  });
});

it('aligns the pencil ends including their outlines for length comparison', () => {
  const svg = readFileSync('assets/questions/sansu/g1/visuals/pencil-compare-a.svg', 'utf8');
  const ends = [...svg.matchAll(/translate\((\d+) \d+\) scale\(([\d.]+) 0.5\)/g)].map(
    (match) => Number(match[1]) + 8 * Number(match[2]),
  );
  expect(ends).toHaveLength(2);
  expect(ends[0]).toBe(ends[1]);
  expect(svg.match(/vector-effect="non-scaling-stroke"/g)).toHaveLength(8);
});
