import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { battleQuestionQuery } from '../../src/scenes/battle/questionQuery';
import { loadContent } from '../../src/core/content/loader';
import { assignedSkillLevel, trainedAssignedSkill } from '../../src/core/progression/assignedSkillTraining';
import mathAssignments from '../../content/math-skill-assignments.json';
import englishAssignments from '../../content/eigo-skill-assignments.json';
import lifeAssignments from '../../content/seikatsu-skill-assignments.json';
import japaneseAssignments from '../../content/kokugo-skill-assignments.json';
import scienceAssignments from '../../content/rika-skill-assignments.json';
import socialAssignments from '../../content/shakai-skill-assignments.json';
import { createNewGame } from '../../src/core/state/newGame';
import { recordLearningResult } from '../../src/scenes/shared/askEnv';
import { QuestionBank } from '../../src/questions/engine/bank';
import { filterCandidates } from '../../src/questions/engine/pick';
import type { QuestionBase } from '../../src/questions/contracts';

const cases = [
  { subject: 'sansu', table: mathAssignments, grade: 1 },
  { subject: 'eigo', table: englishAssignments, grade: 3 },
  { subject: 'seikatsu', table: lifeAssignments, grade: 1 },
  { subject: 'kokugo', table: japaneseAssignments, grade: 1 },
  { subject: 'rika', table: scienceAssignments, grade: 3 },
  { subject: 'shakai', table: socialAssignments, grade: 3 },
] as const;

describe('subject skill question and training integration', () => {
  it.each(cases)('$subject の各技から実際の問題を出題できる', async ({ subject, table }) => {
    const content = await loadContent(async (path) => JSON.parse(readFileSync(`content/${path}`, 'utf8')));
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? files(path) : path.endsWith('.json') ? [path] : [];
      });
    const { bank } = await QuestionBank.load(files(`content/questions/${subject}`), async (path) =>
      JSON.parse(readFileSync(path, 'utf8')),
    );
    for (const id of new Set(Object.values(table))) {
      const skill = content.skills.get(id)!;
      const grade = skill.gradeRange[0];
      const query = battleQuestionQuery(skill, false, grade, bank);
      expect(filterCandidates(bank, query).length, id).toBeGreaterThan(0);
    }
  });
  it('loads assigned skills with question filters and applies their saved level', async () => {
    const content = await loadContent(async (path) => JSON.parse(readFileSync(`content/${path}`, 'utf8')));
    for (const { subject, table } of cases) {
      const id = Object.values(table)[0]!;
      const skill = content.skills.get(id)!;
      expect(skill.subject).toBe(subject);
      expect(skill.questionTags).toContain(`assigned:${id}`);
      const prefix = subject === 'sansu' ? 'math' : subject;
      expect(trainedAssignedSkill(skill, { [`${prefix}-training:${id}`]: 8 }).power).toBe(skill.power);
      expect(trainedAssignedSkill(skill, {}).power).toBeLessThan(skill.power);
    }
  });
  it.each(cases)(
    '$subject limits questions to the chosen skill and learns it on a perfect answer',
    ({ subject, table, grade }) => {
      const entries = Object.entries(table);
      const game = createNewGame({ name: 'ハル', grade }, 100);
      const [id, skill] = entries.find(
        ([questionId, assigned]) =>
          questionId.includes(`.g${grade}.`) && !game.player.skills.includes(assigned),
      )!;
      const other = entries.find(
        ([questionId, assigned]) => questionId.includes(`.g${grade}.`) && assigned !== skill,
      )!;
      const question = (questionId: string): QuestionBase => ({
        id: questionId,
        type: 'choice',
        subject,
        grade,
        unit: `${subject}.g${grade}.test`,
        payload: {},
      });
      const bank = new QuestionBank();
      bank.add(question(id));
      bank.add(question(other[0]));
      expect(
        filterCandidates(bank, { subject, gradeRange: [grade, grade], tags: [`assigned:${skill}`] }).map(
          (q) => q.id,
        ),
      ).toEqual([id]);
      const result = { questionId: id, score: 0.5, timeMs: 100, attempts: 1 };
      recordLearningResult(game, question(id), result, 1, 2, 'battle');
      expect(game.player.skills).not.toContain(skill);
      for (let i = 0; i < 9; i++)
        recordLearningResult(game, question(id), { ...result, score: 1 }, 1, 2, 'battle');
      expect(game.player.skills.filter((value) => value === skill)).toHaveLength(1);
      const prefix = subject === 'sansu' ? 'math' : subject;
      expect(game.progress.counters[`${prefix}-training:${skill}`]).toBe(8);
      expect(assignedSkillLevel(game.progress.counters[`${prefix}-training:${skill}`]!)).toBe(4);
    },
  );
});
