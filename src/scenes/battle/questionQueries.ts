import type { Skill } from '../../core/content/schemas';
import type { QuestionRule } from '../../core/battle/ruleset';
import type { Grade, QuestionQuery, Subject } from '../../questions/contracts';

/** ruleset に従い、従来の skill query または明示された scripted query を選ぶ。 */
export function selectBattleQuestionQuery(
  rule: QuestionRule,
  skillDriven: QuestionQuery,
  scripted: readonly QuestionQuery[] | undefined,
  index: number,
): QuestionQuery {
  if (rule.mode === 'skill-driven') return skillDriven;
  if (!scripted?.length) throw new Error('scripted question query is required for this battle ruleset');
  return scripted[index % scripted.length]!;
}

/** スキルの質問条件。固有スキルはプレイヤー学年から段階的に候補を広げる。 */
export function questionQueryForSkill(input: {
  skill: Skill;
  grade: Grade;
  uniqueSkillIds: Iterable<string>;
  hasCandidate: (query: QuestionQuery) => boolean;
}): QuestionQuery {
  const { skill, grade, hasCandidate } = input;
  const units = skill.unitHint;
  if (!new Set(input.uniqueSkillIds).has(skill.id))
    return { subject: skill.subject, gradeRange: skill.gradeRange, tags: skill.questionTags, units };
  const ranges: [Grade, Grade][] = [
    [Math.max(1, grade - 1) as Grade, grade],
    [1, grade],
    [1, 6],
  ];
  const gradeRange =
    ranges.find((range) => hasCandidate({ subject: skill.subject, gradeRange: range, units })) ?? ranges[2]!;
  return { subject: skill.subject, gradeRange, tags: skill.questionTags, units };
}

export const recruitQuestionQuery = (skill: Skill, areaId: string): QuestionQuery => ({
  subject: skill.subject,
  gradeRange: skill.gradeRange,
  tags: [`prefecture:${areaId}`],
});

export const musubiDamaQuestionQuery = (subject: Subject, grade: Grade, areaId: string): QuestionQuery => ({
  subject,
  gradeRange: [Math.max(1, grade - 1) as Grade, grade],
  tags: [`prefecture:${areaId}`],
});
