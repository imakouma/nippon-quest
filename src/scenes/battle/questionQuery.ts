import type { Skill } from '../../core/content/schemas';
import type { Grade, QuestionQuery } from '../../questions/contracts';
import { filterCandidates, type QuestionBank } from '../../questions/engine';
import { scopeQueryToGrade } from '../../questions/engine/gradeScope';

export function battleQuestionQuery(
  skill: Skill,
  unique: boolean,
  grade: Grade,
  bank: QuestionBank,
): QuestionQuery {
  if (!unique)
    return scopeQueryToGrade(
      { subject: skill.subject, gradeRange: skill.gradeRange, tags: skill.questionTags },
      grade,
    );
  const ranges: [Grade, Grade][] = [
    [Math.max(1, grade - 1) as Grade, grade],
    [1, grade],
    [1, 6],
  ];
  const gradeRange =
    ranges.find(
      (range) => filterCandidates(bank, { subject: skill.subject, gradeRange: range }).length > 0,
    ) ?? ranges[2]!;
  return scopeQueryToGrade({ subject: skill.subject, gradeRange, tags: skill.questionTags }, grade);
}
