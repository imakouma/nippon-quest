import type { Skill } from '../content/schemas';

export function assignedSkillLevel(correct: number): number {
  if (correct >= 8) return 4;
  if (correct >= 4) return 3;
  if (correct >= 2) return 2;
  return 1;
}

export function trainedAssignedSkill(skill: Skill, counters: Readonly<Record<string, number>>): Skill {
  if (!skill.questionTags?.includes(`assigned:${skill.id}`)) return skill;
  const key = `${skill.subject === 'sansu' ? 'math' : skill.subject}-training:${skill.id}`;
  const level = assignedSkillLevel(counters[key] ?? 0);
  return {
    ...skill,
    power: Math.round((skill.power * (28 + level * 3)) / 40),
    accuracy: Math.max(0, (skill.accuracy ?? 100) - (4 - level) * 4),
  };
}
