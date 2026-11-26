import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assignments from '../../content/kokugo-skill-assignments.json';
import skills from '../../content/kokugo-skills.json';
import { skillSchema } from '../../src/core/content/schemas';
import { createNewGame } from '../../src/core/state/newGame';
import { recordLearningResult } from '../../src/scenes/shared/askEnv';
import type { Grade, QuestionBase } from '../../src/questions/contracts';
import { QuestionBank } from '../../src/questions/engine/bank';
import { filterCandidates } from '../../src/questions/engine/pick';

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('.json') ? [path] : [];
  });
}

describe('国語の技と問題の割当', () => {
  it('全問題を同じ学年の有効な技へ一度ずつ割り当てる', () => {
    const all = files('content/questions/kokugo').flatMap(
      (file) => JSON.parse(readFileSync(file, 'utf8')) as QuestionBase[],
    );
    const byId = new Map(skills.map((skill) => [skill.id, skillSchema.parse(skill)]));
    const table: Readonly<Record<string, string>> = assignments;
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
    expect(Object.keys(table)).toHaveLength(all.length);
    expect(byId.size).toBe(skills.length);
    for (const q of all) {
      const skill = byId.get(table[q.id]!);
      expect(skill, q.id).toBeDefined();
      expect(skill!.subject, q.id).toBe('kokugo');
      expect(skill!.gradeRange, q.id).toEqual([q.grade, q.grade]);
      expect(skill!.questionTags, q.id).toContain(`assigned:${skill!.id}`);
      expect(skill!.power, q.id).toBeGreaterThan(0);
      expect(skill!.accuracy, q.id).toBeGreaterThan(0);
      expect(skill!.mp, q.id).toBe(0);
    }
  });
  it('すべての技に実際に出題できる問題がある', async () => {
    const paths = files('content/questions/kokugo');
    const { bank, report } = await QuestionBank.load(paths, async (path) =>
      JSON.parse(readFileSync(path, 'utf8')),
    );
    expect(report.skipped).toEqual([]);
    for (const skill of skills) {
      expect(
        filterCandidates(bank, {
          subject: 'kokugo',
          gradeRange: skill.gradeRange as [Grade, Grade],
          tags: [`assigned:${skill.id}`],
        }).length,
        skill.id,
      ).toBeGreaterThan(0);
    }
  });
  it('技の出題は割当された問題だけに絞る', () => {
    const rows = JSON.parse(
      readFileSync('content/questions/kokugo/g1/bun-no-kimari/set-001.json', 'utf8'),
    ) as QuestionBase[];
    const other = JSON.parse(
      readFileSync('content/questions/kokugo/g1/dokkai/set-001.json', 'utf8'),
    ) as QuestionBase[];
    const bank = new QuestionBank();
    for (const question of [...rows, ...other]) bank.add(question);
    const skill = (assignments as Readonly<Record<string, string>>)[rows[0]!.id]!;
    const candidates = filterCandidates(bank, {
      subject: 'kokugo',
      gradeRange: [1, 1],
      tags: [`assigned:${skill}`],
    });
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((q) => (assignments as Readonly<Record<string, string>>)[q.id] === skill)).toBe(
      true,
    );
  });
  it('満点のみで習得し、回数を保存して上限8回にする', () => {
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    const id = 'kokugo.g1.dokkai.0001';
    const question: QuestionBase = {
      id,
      type: 'choice',
      subject: 'kokugo',
      grade: 1,
      unit: 'kokugo.g1.dokkai',
      payload: {},
    };
    const skill = (assignments as Readonly<Record<string, string>>)[id]!;
    const result = { questionId: id, score: 0.5, timeMs: 100, attempts: 1 };
    recordLearningResult(game, question, result, 1, 2, 'battle');
    expect(game.player.skills).not.toContain(skill);
    for (let i = 0; i < 9; i++) recordLearningResult(game, question, { ...result, score: 1 }, 1, 2, 'battle');
    expect(game.player.skills.filter((id) => id === skill)).toHaveLength(1);
    expect(game.progress.counters[`kokugo-training:${skill}`]).toBe(8);
  });
});
