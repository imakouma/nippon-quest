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
