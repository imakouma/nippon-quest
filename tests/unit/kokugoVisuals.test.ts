// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { questionBaseSchema } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';

const questions = readdirSync('content/questions/kokugo', { recursive: true })
  .filter((file) => String(file).endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(`content/questions/kokugo/${file}`, 'utf8')) as unknown[])
  .map((q) => questionBaseSchema.parse(q))
  .sort((a, b) => a.id.localeCompare(b.id));

it('preserves all Japanese question identities and answers', () => {
  expect(questions).toHaveLength(4665);
  const rows = questions.map((q) => {
    const p = q.payload as Record<string, unknown>;
    return [q.id, q.type, q.grade, q.unit, p.answer, p.answers, p.choices];
  });
  expect(createHash('sha256').update(JSON.stringify(rows)).digest('hex')).toBe(
    '285f070c3df05e6829041786d699e2f2792071c69fffb2de7688e737f4a068ec',
  );
});

it('records every review and supplies valid accessible diagrams with large labels', () => {
  const review = ['g1-g2', 'g3-g6'].flatMap(
    (grades) =>
      JSON.parse(readFileSync(`scripts/data/kokugo-${grades}-visual-review.json`, 'utf8')) as {
        id: string;
        decision: string;
        reason: string;
      }[],
  );
  expect(review.map((row) => row.id).sort()).toEqual(questions.map((q) => q.id).sort());
  const illustrated = review.filter((row) => row.decision === 'illustrated');
  expect(illustrated.length).toBeGreaterThan(0);
  for (const row of review) expect(row.reason.length, row.id).toBeGreaterThan(8);
  for (const row of illustrated) {
    const q = questions.find((q) => q.id === row.id)!;
    const p = getRenderer(q.type)!.schema.parse(q.payload) as {
      promptImage: string;
      promptSpeech?: string;
      promptImageAlt?: string;
    };
    expect(p.promptImage, row.id).toContain('questions/kokugo/visuals/');
    expect(p.promptSpeech ?? p.promptImageAlt, row.id).toBeTruthy();
    const svg = readFileSync(`assets/${p.promptImage}`, 'utf8');
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('parsererror'), row.id).toBeNull();
    expect(doc.querySelector('title')?.textContent, row.id).toBeTruthy();
    expect(svg, row.id).not.toMatch(/<script|<foreignObject|href="https?:|undefined/);
    for (const label of doc.querySelectorAll('text')) {
      expect(Number(label.getAttribute('font-size')), row.id).toBeGreaterThanOrEqual(24);
    }
  }
});

it('does not fill particle blanks in the spoken diagram description', () => {
  for (const q of questions) {
    const p = q.payload as { prompt?: string; promptImage?: string; promptSpeech?: string };
    if (!p.promptImage?.startsWith('questions/kokugo/visuals/g1-')) continue;
    if (!/___|__/.test(p.prompt ?? '')) continue;
    const description = p.promptSpeech?.slice(p.prompt?.length ?? 0) ?? '';
    expect(description, q.id).not.toMatch(/あめが|雨が|えんぴつと|鉛筆と|ほんを|本を/);
  }
});
