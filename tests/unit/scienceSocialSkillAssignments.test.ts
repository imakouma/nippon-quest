import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import scienceAssignments from '../../content/rika-skill-assignments.json';
import scienceSkills from '../../content/rika-skills.json';
import socialAssignments from '../../content/shakai-skill-assignments.json';
import socialSkills from '../../content/shakai-skills.json';
import { skillSchema } from '../../src/core/content/schemas';
import { battleQuestionQuery } from '../../src/scenes/battle/questionQuery';
import { QuestionBank } from '../../src/questions/engine/bank';
import { filterCandidates } from '../../src/questions/engine/pick';
import type { QuestionBase } from '../../src/questions/contracts';

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('.json') ? [path] : [];
  });
}

const subjects = [
  { subject: 'rika', assignments: scienceAssignments, skills: scienceSkills },
  { subject: 'shakai', assignments: socialAssignments, skills: socialSkills },
] as const;

describe.each(subjects)('$subject の技と問題', ({ subject, assignments, skills }) => {
  it('全問題の学年・単元と割当先が一致し、全技から出題できる', () => {
    const questions = files(`content/questions/${subject}`).flatMap(
      (file) => JSON.parse(readFileSync(file, 'utf8')) as QuestionBase[],
    );
    const table: Readonly<Record<string, string>> = assignments;
    const byId = new Map(skills.map((row) => [row.id, skillSchema.parse(row)]));
    expect(byId.size).toBe(skills.length);
    expect(Object.keys(table).sort()).toEqual(questions.map((q) => q.id).sort());
    const bank = new QuestionBank();
    for (const question of questions) {
      bank.add(question);
      const skill = byId.get(table[question.id] ?? '');
      expect(skill, question.id).toBeDefined();
      expect(skill!.gradeRange).toEqual([question.grade, question.grade]);
      expect(skill!.unitHint).toContain(question.unit);
      expect(skill!.mp).toBe(0);
      expect(skill!.costGauge).toBe(0);
    }
    for (const skill of byId.values()) {
      const query = battleQuestionQuery(skill, false, skill.gradeRange[0], bank);
      expect(filterCandidates(bank, query).length, skill.id).toBeGreaterThan(0);
    }
  });
});

it('戦争中と戦後の問題をそれぞれの技に分ける', () => {
  const table: Readonly<Record<string, string>> = socialAssignments;
  expect(table['legacy.shakai.g6.soc-6-10.8122a8c75683']).toBe('sk-shakai-g6-war');
  expect(table['legacy.shakai.g6.soc-6-10.f869cc1a6ad1']).toBe('sk-shakai-g6-postwar');
});
