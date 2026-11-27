import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { stripRuby } from '../../src/ui/ruby';

const rows = JSON.parse(readFileSync('scripts/data/kokugo-passage-review.json', 'utf8')) as {
  id: string;
  status: string;
  prompt?: string;
  answer?: string;
  timeLimitSec?: number;
}[];
const questions = readdirSync('content/questions/kokugo/g4', { recursive: true })
  .filter((file) => String(file).endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(`content/questions/kokugo/g4/${file}`, 'utf8')));

it('keeps seven reviewed original practice questions self-contained', () => {
  const originals = rows.filter((row) => row.status === 'replaced-original');
  expect(originals).toHaveLength(7);
  expect(rows.filter((row) => row.status === 'restored')).toHaveLength(12);
  expect(rows.filter((row) => row.status === 'needs-source')).toHaveLength(0);
  for (const row of originals) {
    const q = questions.find((entry) => entry.id === row.id);
    expect(q.payload.prompt, row.id).toContain('練習用[れんしゅうよう]');
    expect(q.payload.prompt, row.id).not.toMatch(/原文|本文引用|木下利玄|りんごどろぼう|牛のリオと陸/);
    expect(q.timeLimitSec, row.id).toBe(row.timeLimitSec);
    expect([90, 120]).toContain(q.timeLimitSec);
    const choices = q.payload.choices as { id: string; text: string }[];
    expect(new Set(choices.map((choice) => choice.id)).size).toBe(choices.length);
    expect(new Set(choices.map((choice) => stripRuby(choice.text, 'kana'))).size).toBe(choices.length);
    expect(choices.filter((choice) => choice.id === q.payload.answer)).toHaveLength(1);
  }
});

it('uses an original tanka with a verified five-seven-five-seven-seven reading', () => {
  const poem = questions.find((q) => q.id.endsWith('a94e12e7a508'));
  const lines = stripRuby(poem.payload.prompt.split('\n\n')[1], 'kana').split('／');
  expect(lines).toEqual(['しろいとり', 'つばさひろげて', 'そらたかく', 'はばたきながら', 'くものかなたへ']);
  expect(lines.map((line) => [...line].length)).toEqual([5, 7, 5, 7, 7]);
});
