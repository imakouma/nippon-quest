import type { Skill } from '../content/schemas';

export function mathSkillLevel(correct: number): number {
  if (correct >= 8) return 4;
  if (correct >= 4) return 3;
  if (correct >= 2) return 2;
  return 1;
}

export function trainedMathSkill(skill: Skill, counters: Record<string, number>): Skill {
  if (!skill.questionTags?.includes('assigned:' + skill.id)) return skill;
  const level = mathSkillLevel(counters['math-training:' + skill.id] ?? 0);
  return {
    ...skill,
    power: Math.round(skill.power * (0.7 + level * 0.075)),
    accuracy: (skill.accuracy ?? 100) - (4 - level) * 4,
  };
}
