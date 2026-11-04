import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const readJson = (path: string) => JSON.parse(readFileSync(`${root}/${path}`, 'utf8'));

describe('grade 3 recess table questions', () => {
  it('keeps the original id and presents five independently answerable tables', () => {
    const questions = readJson('content/questions/sansu/g3/legacy-math-3-7/set-001.json');
    const id = 'legacy.sansu.g3.math-3-7.54bfe42d11e7';
    const tables = questions.filter(
      (question: { id: string }) => question.id === id || question.id.startsWith(`${id}.`),
    );
    expect(tables.map((question: { payload: { answers: string[] } }) => question.payload.answers)).toEqual([
      ['9'],
      ['4'],
      ['5'],
      ['37'],
      ['110'],
    ]);
    const curriculum = readFileSync(`${root}/content/curriculum/sansu-g3-term1.json`, 'utf8');
    for (const question of tables) {
      expect(curriculum).toContain(`"questionId": "${question.id}"`);
      const svg = readFileSync(`${root}/assets/${question.payload.promptImage}`, 'utf8');
      expect(svg.match(/>□<\/text>/g)).toHaveLength(1);
      expect(svg.match(/<path /g)).toHaveLength(15);
    }
  });
});
