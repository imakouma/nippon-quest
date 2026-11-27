import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';

const review = JSON.parse(readFileSync('scripts/data/kokugo-passage-review.json', 'utf8')) as {
  id: string;
  status: string;
  summary?: string;
  question?: string;
  answer?: string;
  timeLimitSec?: number;
  source?: {
    file: string;
    sha256: string;
    pdfPage: number;
    printedPage: number;
    work: string;
    author: string;
  };
}[];
const questions = readdirSync('content/questions/kokugo', { recursive: true })
  .filter((file) => String(file).endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(`content/questions/kokugo/${file}`, 'utf8')));

// The source review remains a historical record. The integrated game now uses
// separately reviewed practice passages; check both records without restoring old text.
const current = JSON.parse(readFileSync('scripts/data/kokugo-current-passage-review.json', 'utf8')) as {
  id: string;
  prompt: string;
  choices: { id: string; text: string }[];
  answer: string;
}[];

it('preserves source provenance and the reviewed current practice passages', () => {
  expect(review).toHaveLength(19);
  expect(new Set(review.map((row) => row.id)).size).toBe(19);
  expect(review.filter((row) => row.status === 'restored')).toHaveLength(12);
  expect(review.filter((row) => row.status === 'replaced-original')).toHaveLength(7);
  expect(current.map((row) => row.id).sort()).toEqual(review.map((row) => row.id).sort());
  for (const row of review.filter((entry) => entry.status === 'restored')) {
    expect(row.summary, row.id).toBeTruthy();
    expect(row.source!.sha256, row.id).toMatch(/^[a-f0-9]{64}$/);
    expect(row.source!.work, row.id).toBeTruthy();
    expect(row.source!.author, row.id).toBeTruthy();
  }
  for (const row of current) {
    const q = questions.find((entry) => entry.id === row.id);
    expect(q.payload.prompt, row.id).toBe(row.prompt);
    expect(q.payload.choices, row.id).toEqual(row.choices);
    expect(q.payload.answer, row.id).toBe(row.answer);
    expect(
      row.choices.filter((choice) => choice.id === row.answer),
      row.id,
    ).toHaveLength(1);
    expect(q.timeLimitSec, row.id).toBeGreaterThanOrEqual(90);
  }
});

it('keeps the revised paragraph role and heartbeat questions unambiguous', () => {
  const role = questions.find((q) => q.id.endsWith('51a081fff200'));
  expect(role.payload.prompt).toContain('この段落[だんらく]のおもな役割[やくわり]');
  const heart = questions.find((q) => q.id.endsWith('98feb53edf80'));
  expect(heart.payload.answer).toBe('c1');
  expect(heart.payload.choices.find((c: { id: string }) => c.id === 'c1').text).toBe(
    '体温[たいおん]と心拍数[しんぱくすう]',
  );
  expect(heart.explanation).not.toContain('心ばく');
});
