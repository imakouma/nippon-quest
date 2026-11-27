import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import ledger from '../../tasks/subject-skill-semantic-review-20261126.json';
import mathAssignments from '../../content/math-skill-assignments.json';
import mathSkills from '../../content/math-skills.json';
import kokugoAssignments from '../../content/kokugo-skill-assignments.json';
import kokugoSkills from '../../content/kokugo-skills.json';
import rikaAssignments from '../../content/rika-skill-assignments.json';
import shakaiAssignments from '../../content/shakai-skill-assignments.json';
import rikaSkills from '../../content/rika-skills.json';
import shakaiSkills from '../../content/shakai-skills.json';
import seikatsuAssignments from '../../content/seikatsu-skill-assignments.json';
import seikatsuSkills from '../../content/seikatsu-skills.json';
import eigoAssignments from '../../content/eigo-skill-assignments.json';
import eigoSkills from '../../content/eigo-skills.json';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([k, v]) => [k, canonical(v)]),
    );
  }
  return value;
}

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('.json') ? [path] : [];
  });
}

it('意味を確認済みの問題・技が変わったら再確認が必要とわかる', () => {
  const assignments: Record<string, string> = {
    ...mathAssignments,
    ...kokugoAssignments,
    ...rikaAssignments,
    ...shakaiAssignments,
    ...seikatsuAssignments,
    ...eigoAssignments,
  };
  const skills = new Map(
    [...mathSkills, ...kokugoSkills, ...rikaSkills, ...shakaiSkills, ...seikatsuSkills, ...eigoSkills].map(
      (skill) => [skill.id, skill],
    ),
  );
  const questions = new Map(
    ['sansu', 'kokugo', 'rika', 'shakai', 'seikatsu', 'eigo'].flatMap((subject) =>
      files(`content/questions/${subject}`).flatMap((path) =>
        (
          JSON.parse(readFileSync(path, 'utf8')) as {
            id: string;
            subject: string;
            grade: number;
            unit: string;
          }[]
        ).map((question) => [question.id, question] as const),
      ),
    ),
  );
  expect(Object.keys(ledger.reviewed).sort()).toEqual([...questions.keys()].sort());
  expect(Object.keys(assignments).sort()).toEqual([...questions.keys()].sort());
  for (const [id, expected] of Object.entries(ledger.reviewed)) {
    const question = questions.get(id);
    const skill = skills.get(assignments[id] ?? '');
    expect(question, id).toBeDefined();
    expect(skill, id).toBeDefined();
    expect(skill!.subject, id).toBe(question!.subject);
    expect(skill!.gradeRange[0], id).toBeLessThanOrEqual(question!.grade);
    expect(skill!.gradeRange[1], id).toBeGreaterThanOrEqual(question!.grade);
    if ('unitHint' in skill! && skill.unitHint) expect(skill.unitHint, id).toContain(question!.unit);
    const actual = createHash('sha256')
      .update(JSON.stringify(canonical({ question, skill })))
      .digest('hex');
    expect(actual, id).toBe(expected);
  }
}, 120_000);
