import { describe, expect, it } from 'vitest';
import { assignedSkillLevel, trainedAssignedSkill } from '../../src/core/progression/assignedSkillTraining';
import type { Skill } from '../../src/core/content/schemas';

describe('assigned skill training', () => {
  it('reaches levels 2, 3 and 4 at two, four and eight correct answers', () => {
    expect([0, 1, 2, 3, 4, 7, 8].map(assignedSkillLevel)).toEqual([1, 1, 2, 2, 3, 3, 4]);
  });
  it('uses the legacy math counter and scales only assigned skills', () => {
    const skill = {
      id: 'sk-example',
      subject: 'sansu',
      power: 100,
      accuracy: 100,
      questionTags: ['assigned:sk-example'],
    } as Skill;
    expect(trainedAssignedSkill(skill, { 'math-training:sk-example': 8 }).power).toBe(100);
    expect(trainedAssignedSkill(skill, {}).power).toBe(78);
    expect(trainedAssignedSkill({ ...skill, questionTags: [] }, {})).toEqual({ ...skill, questionTags: [] });
  });
});

it('学年共通の教科バーストは、設定学年が上がると威力も上がる', async () => {
  const { subjectBurstForGrade } = await import('../../src/core/progression/assignedSkillTraining');
  const burst = { id: 'sk-burst-sansu', subject: 'sansu', power: 180 } as Skill;
  const uniqueSkills = { sansu: burst.id };
  expect(subjectBurstForGrade(burst, 1, uniqueSkills).power).toBe(80);
  expect(subjectBurstForGrade(burst, 3, uniqueSkills).power).toBe(205);
  expect(subjectBurstForGrade(burst, 6, uniqueSkills).power).toBe(490);
  const other = { ...burst, id: 'sk-normal' };
  expect(subjectBurstForGrade(other, 6, uniqueSkills)).toBe(other);
});
