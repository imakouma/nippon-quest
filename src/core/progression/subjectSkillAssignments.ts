import shakaiSkills from '../../../content/shakai-skills.json';
import shakai from '../../../content/shakai-skill-assignments.json';
import rikaSkills from '../../../content/rika-skills.json';
import rika from '../../../content/rika-skill-assignments.json';
import mathSkills from '../../../content/math-skills.json';
import math from '../../../content/math-skill-assignments.json';
import kokugoSkills from '../../../content/kokugo-skills.json';
import eigoSkills from '../../../content/eigo-skills.json';
import seikatsuSkills from '../../../content/seikatsu-skills.json';
import kokugo from '../../../content/kokugo-skill-assignments.json';
import eigo from '../../../content/eigo-skill-assignments.json';
import seikatsu from '../../../content/seikatsu-skill-assignments.json';
import type { Subject } from '../content/schemas';

const assignments: Partial<Record<Subject, Readonly<Record<string, string>>>> = {
  shakai,
  rika,
  sansu: math,
  kokugo,
  eigo,
  seikatsu,
};

export function assignedSkillForQuestion(subject: Subject, questionId: string): string | undefined {
  return assignments[subject]?.[questionId];
}

export function assignedSkillIds(subject: Subject): ReadonlySet<string> {
  return new Set(Object.values(assignments[subject] ?? {}));
}

export const subjectSkillRows = [
  ['shakai', shakaiSkills],
  ['rika', rikaSkills],
  ['sansu', mathSkills],
  ['kokugo', kokugoSkills],
  ['eigo', eigoSkills],
  ['seikatsu', seikatsuSkills],
] as const;
