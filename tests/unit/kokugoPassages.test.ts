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

it('restores the twelve verified passages with provenance and time to read', () => {
  expect(review).toHaveLength(19);
  expect(new Set(review.map((row) => row.id)).size).toBe(19);
  const restored = review.filter((row) => row.status === 'restored');
  expect(restored).toHaveLength(12);
  expect(review.filter((row) => row.status === 'needs-source')).toHaveLength(7);
  for (const row of restored) {
    const q = questions.find((q) => q.id === row.id);
    expect(row.summary, row.id).toBeTruthy();
    expect(q.payload.prompt, row.id).toContain(row.summary);
    expect(q.payload.prompt, row.id).toContain('要約');
    expect(q.payload.prompt, row.id).not.toMatch(/原文|本文引用/);
    expect(q.payload.prompt, row.id).toContain(row.question);
    expect(q.payload.answer, row.id).toBe(row.answer);
    expect(q.timeLimitSec, row.id).toBeGreaterThanOrEqual(90);
    expect(q.explanation, row.id).toContain(row.source!.work);
    expect(q.explanation, row.id).toContain(row.source!.author);
    expect(row.source!.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(q.payload.prompt, row.id).not.toMatch(/■|問いかける部分|接続詞の空欄/);
  }
});

it('repairs the source-confirmed question and heartbeat spelling without changing the answer ID', () => {
  const role = questions.find((q) => q.id.endsWith('51a081fff200'));
  expect(role.payload.prompt).toContain('①だん落の役わり');
  const heart = questions.find((q) => q.id.endsWith('98feb53edf80'));
  expect(heart.payload.answer).toBe('c1');
  expect(heart.payload.choices.find((c: { id: string }) => c.id === 'c1').text).toBe('体温と心ぱく数');
  expect(heart.explanation).not.toContain('心ばく');
});
