import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assignments from '../../content/rika-skill-assignments.json';
import skills from '../../content/rika-skills.json';
import { skillSchema } from '../../src/core/content/schemas';
import { QuestionBank } from '../../src/questions/engine/bank';
import { filterCandidates } from '../../src/questions/engine/pick';
import { recordLearningResult } from '../../src/scenes/shared/askEnv';
import { createNewGame } from '../../src/core/state/newGame';
import type { QuestionBase } from '../../src/questions/contracts';

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('.json') ? [path] : [];
  });
}

describe('理科3年の技', () => {
  const questions = files('content/questions/rika/g3').flatMap(
    (file) => JSON.parse(readFileSync(file, 'utf8')) as QuestionBase[],
  );
  const mapping: Readonly<Record<string, string>> = assignments;
  const byId = new Map(skills.map((row) => [row.id, skillSchema.parse(row)]));

  it('全問に内容と学年に合う技を割り当てる', () => {
    expect(questions.every((q) => mapping[q.id] !== undefined)).toBe(true);
    for (const question of questions) {
      const skill = byId.get(mapping[question.id] ?? '');
      expect(skill, question.id).toBeDefined();
      expect(skill!.subject).toBe('rika');
      expect(skill!.gradeRange).toEqual([3, 3]);
      expect(skill!.unitHint).toContain(question.unit);
    }
    const sound = questions.find((q) => q.id.endsWith('1baad717e855'))!;
    const light = questions.find((q) => q.id.endsWith('16fe7ff6d3a6'))!;
    expect(mapping[sound.id]).toBe('sk-rika-g3-sound');
    expect(mapping[light.id]).toBe('sk-rika-g3-light');
  });

  it('技ごとに出題され、満点回答で習得して育つ', () => {
    const question = questions.find((q) => q.id.endsWith('1baad717e855'))!;
    const bank = new QuestionBank();
    for (const q of questions) bank.add(q);
    const candidates = filterCandidates(bank, {
      subject: 'rika',
      gradeRange: [3, 3],
      tags: ['assigned:sk-rika-g3-sound'],
    });
    expect(candidates).toContain(question);
    expect(candidates.every((q) => mapping[q.id] === 'sk-rika-g3-sound')).toBe(true);
    const game = createNewGame({ name: 'ハル', grade: 3 }, 100);
    const result = { questionId: question.id, score: 1, timeMs: 100, attempts: 1 };
    recordLearningResult(game, question, result, 1, 2, 'battle');
    expect(game.player.skills).toContain('sk-rika-g3-sound');
    expect(game.progress.counters['rika-training:sk-rika-g3-sound']).toBe(1);
  });
});

describe('理科4年の技', () => {
  const questions = files('content/questions/rika/g4').flatMap(
    (file) => JSON.parse(readFileSync(file, 'utf8')) as QuestionBase[],
  );
  const mapping: Readonly<Record<string, string>> = assignments;
  const byId = new Map(skills.map((row) => [row.id, skillSchema.parse(row)]));
  it('全問に同じ学年の技を割り当て、各技に出題できる問題がある', () => {
    const bank = new QuestionBank();
    for (const question of questions) {
      bank.add(question);
      const skill = byId.get(mapping[question.id] ?? '');
      expect(skill, question.id).toBeDefined();
      expect(skill!.gradeRange).toEqual([4, 4]);
      expect(skill!.unitHint).toContain(question.unit);
    }
    for (const id of new Set(questions.map((q) => mapping[q.id]!))) {
      expect(
        filterCandidates(bank, { subject: 'rika', gradeRange: [4, 4], tags: [`assigned:${id}`] }).length,
        id,
      ).toBeGreaterThan(0);
    }
  });
});
