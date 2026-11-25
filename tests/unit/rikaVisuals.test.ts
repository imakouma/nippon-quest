// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { questionBaseSchema } from '../../src/questions/contracts';
import { getRenderer } from '../../src/questions/renderers/registry';

const questions = readdirSync('content/questions/rika', { recursive: true })
  .filter((file) => String(file).endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(`content/questions/rika/${file}`, 'utf8')) as unknown[])
  .map((q) => questionBaseSchema.parse(q))
  .sort((a, b) => a.id.localeCompare(b.id));

it('preserves all 689 science learning targets and reviewed answer keys and choices', () => {
  expect(questions).toHaveLength(689);
  const rows = questions.map((q) => {
    const p = getRenderer(q.type)!.schema.parse(q.payload) as Record<string, unknown>;
    return [q.id, q.type, q.grade, q.unit, p.answer, p.answers, p.choices];
  });
  // Reviewed content corrections: tasks/nonmath-audit-repair-20261124-result.md.
  expect(createHash('sha256').update(JSON.stringify(rows)).digest('hex')).toBe(
    'df3ad276db0b3cbaf095fa6bd748ddbeb2fac28698b34639fb8fe51be02beafc',
  );
});
it('illustrates circuits, magnets, compression, plant growth and generation', () => {
  for (const hash of ['e9416fa6bbec', '42f3e50c6206', '600963ece2ca', 'c7a2088d9d7b', '7120e72536af']) {
    const q = questions.find((q) => q.id.endsWith(hash))!;
    expect((q.payload as { promptImage?: string }).promptImage, q.id).toContain('questions/rika/visuals/');
  }
});
it('records every review and keeps every new diagram self-contained and accessible', () => {
  const review = JSON.parse(readFileSync('scripts/data/rika-visual-review.json', 'utf8')) as {
    id: string;
    decision: string;
    reason: string;
  }[];
  expect(review.map((r) => r.id).sort()).toEqual(questions.map((q) => q.id).sort());
  for (const r of review) {
    expect(r.reason.length).toBeGreaterThan(8);
    if (r.decision !== 'illustrated') continue;
    const q = questions.find((q) => q.id === r.id)!;
    const p = getRenderer(q.type)!.schema.parse(q.payload) as {
      promptImage: string;
      promptSpeech?: string;
      promptImageAlt?: string;
    };
    expect(p.promptSpeech ?? p.promptImageAlt).toBeTruthy();
    const svg = readFileSync(`assets/${p.promptImage}`, 'utf8');
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('parsererror'), q.id).toBeNull();
    expect(doc.querySelector('title')?.textContent, q.id).toBeTruthy();
    expect(svg).not.toMatch(/<script|<foreignObject|href="https?:|undefined/);
  }
});

it('restores missing statements without exposing the selected answer in speech', () => {
  const repairs = JSON.parse(readFileSync('scripts/data/rika-source-repairs.json', 'utf8')) as {
    id: string;
    prompt: string;
    sourceAnswer: string;
    reviewedAnswer?: string;
  }[];
  for (const repair of repairs) {
    const p = questions.find((q) => q.id === repair.id)!.payload as {
      prompt: string;
      answer: string;
      choices: { id: string; text: string }[];
    };
    const normalize = (text: string) =>
      text
        .replace(/\[[^\]]+\]/g, '')
        .normalize('NFKC')
        .replace(/[\s,、・。]/g, '');
    expect(normalize(p.choices.find((choice) => choice.id === p.answer)!.text), repair.id).toBe(
      normalize(repair.reviewedAnswer ?? repair.sourceAnswer),
    );
    expect(p.prompt, repair.id).toBe(repair.prompt);
    expect(p.prompt.length).toBeGreaterThan(15);
  }
  for (const [hash, answer] of [
    ['6b5fef5033f0', '胸'],
    ['130d28eef4b2', '幼虫'],
    ['2152ca71a8c7', 'オリオン座'],
    ['dd879a5ec396', '根'],
    ['0467332dc3f0', '心臓'],
    ['21ad9cdcbae9', 'じん臓'],
    ['786a76b64a62', 'えら'],
  ]) {
    const p = questions.find((q) => q.id.endsWith(hash!))!.payload as {
      prompt: string;
      promptSpeech: string;
    };
    expect(p.promptSpeech.slice(p.prompt.length), hash).not.toContain(answer);
  }
  const mass = questions.find((q) => q.id.endsWith('a3fd7dd5cc5b'))!.payload as {
    prompt: string;
    template: string;
    promptImageAlt: string;
  };
  expect(mass.prompt).toContain('ミョウバン');
  expect(mass.promptImageAlt).toContain('ミョウバン');
  expect(mass.promptImageAlt).not.toContain('食塩');
  expect(mass.template).toBe('{{INPUT}} g');
});
