import type { Skill } from '../../core/content/schemas';
import type { Grade, QuestionQuery } from '../../questions/contracts';

/** スキルの質問条件。固有スキルはプレイヤー学年から段階的に候補を広げる。 */
export function questionQueryForSkill(input: {
  skill: Skill;
  grade: Grade;
  uniqueSkillIds: Iterable<string>;
  hasCandidate: (query: QuestionQuery) => boolean;
}): QuestionQuery {
  const { skill, grade, hasCandidate } = input;
  if (!new Set(input.uniqueSkillIds).has(skill.id))
    return { subject: skill.subject, gradeRange: skill.gradeRange, tags: skill.questionTags };
  const ranges: [Grade, Grade][] = [
    [Math.max(1, grade - 1) as Grade, grade],
    [1, grade],
    [1, 6],
  ];
  const gradeRange =
    ranges.find((range) => hasCandidate({ subject: skill.subject, gradeRange: range })) ?? ranges[2]!;
  return { subject: skill.subject, gradeRange, tags: skill.questionTags };
}

export const recruitQuestionQuery = (skill: Skill, areaId: string): QuestionQuery => ({
  subject: skill.subject,
  gradeRange: skill.gradeRange,
  tags: [`prefecture:${areaId}`],
});
