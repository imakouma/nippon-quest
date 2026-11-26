import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assignments from '../../content/shakai-skill-assignments.json';
import skills from '../../content/shakai-skills.json';
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

describe('社会3年の技', () => {
  const questions = files('content/questions/shakai/g3').flatMap(
    (file) => JSON.parse(readFileSync(file, 'utf8')) as QuestionBase[],
  );
  const mapping: Readonly<Record<string, string>> = assignments;
  const byId = new Map(skills.map((row) => [row.id, skillSchema.parse(row)]));

  it('全問に内容と学年に合う技を割り当てる', () => {
    expect(questions.every((q) => mapping[q.id] !== undefined)).toBe(true);
    for (const question of questions) {
      const skill = byId.get(mapping[question.id] ?? '');
      expect(skill, question.id).toBeDefined();
      expect(skill!.subject).toBe('shakai');
      expect(skill!.gradeRange).toEqual([3, 3]);
      expect(skill!.unitHint).toContain(question.unit);
    }
    const map = questions.find((q) => q.id.endsWith('07eb94321124'))!;
    const history = questions.find((q) => q.id.endsWith('193edc441194'))!;
    const town = questions.find((q) => q.id.endsWith('205f0d28f7ab'))!;
    expect(mapping[map.id]).toBe('sk-shakai-g3-map');
    expect(mapping[history.id]).toBe('sk-shakai-g3-heritage');
    expect(mapping[town.id]).toBe('sk-shakai-g3-town');
  });

  it('割り当てた技から出題し、満点で習得する', () => {
    const question = questions.find((q) => q.id.endsWith('07eb94321124'))!;
    const bank = new QuestionBank();
    for (const q of questions) bank.add(q);
    const candidates = filterCandidates(bank, {
      subject: 'shakai',
      gradeRange: [3, 3],
      tags: ['assigned:sk-shakai-g3-map'],
    });
    expect(candidates).toContain(question);
    expect(candidates.every((q) => mapping[q.id] === 'sk-shakai-g3-map')).toBe(true);
    const game = createNewGame({ name: 'ハル', grade: 3 }, 100);
    recordLearningResult(
      game,
      question,
      { questionId: question.id, score: 1, timeMs: 100, attempts: 1 },
      1,
      2,
      'battle',
    );
    expect(game.player.skills).toContain('sk-shakai-g3-map');
    expect(game.progress.counters['shakai-training:sk-shakai-g3-map']).toBe(1);
  });
});

describe('社会4年の技', () => {
  const questions = files('content/questions/shakai/g4').flatMap(
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
        filterCandidates(bank, { subject: 'shakai', gradeRange: [4, 4], tags: [`assigned:${id}`] }).length,
        id,
      ).toBeGreaterThan(0);
    }
  });
});
