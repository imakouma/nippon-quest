import { describe, expect, it } from 'vitest';
import definitions from '../../content/skills.json';
import { skillSchema } from '../../src/core/content/schemas';
import { mathSkillLevel, trainedMathSkill } from '../../src/core/progression/mathSkillLevel';

describe('算数技の成長', () => {
  it('満点2・4・8回で昇級し、たしざんぎりの威力と命中率が上がる', () => {
    const skill = skillSchema.parse(definitions.find((entry) => entry.id === 'sk-tashizan-giri'));
    expect([0, 1, 2, 3, 4, 7, 8, 9].map(mathSkillLevel)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    const stages = [0, 2, 4, 8].map((correct) =>
      trainedMathSkill(skill, { ['math-training:' + skill.id]: correct }),
    );
    expect(stages.map((s) => s.power)).toEqual([31, 34, 37, 40]);
    expect(stages.map((s) => s.accuracy)).toEqual([88, 92, 96, 100]);
  });
});
