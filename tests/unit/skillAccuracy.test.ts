import { describe, expect, it, vi } from 'vitest';
import { skillHits } from '../../src/core/battle/skillEffects';
import { createRng } from '../../src/core/rng';

describe('技の命中率', () => {
  it('0%は必ず外れ、100%は必ず当たり、乱数を消費しない', () => {
    const rng = createRng('accuracy');
    const chance = vi.spyOn(rng, 'chance');
    expect(skillHits(0, rng)).toBe(false);
    expect(skillHits(100, rng)).toBe(true);
    expect(chance).not.toHaveBeenCalled();
  });

  it('中間値は指定された確率で判定する', () => {
    const rng = createRng('accuracy');
    const chance = vi.spyOn(rng, 'chance').mockReturnValue(false);
    expect(skillHits(75, rng)).toBe(false);
    expect(chance).toHaveBeenCalledWith(0.75);
  });
});

describe('技データの検証', () => {
  it('命中率と追加効果の確率が0〜100の範囲を超えると拒否する', async () => {
    const { skillSchema } = await import('../../src/core/content/schemas');
    const base = {
      id: 'sk-accuracy-test',
      name: 'テスト',
      subject: 'kokugo',
      gradeRange: [1, 1],
      power: 100,
      element: 'none',
      mp: 0,
    };
    expect(skillSchema.safeParse({ ...base, accuracy: -1 }).success).toBe(false);
    expect(skillSchema.safeParse({ ...base, accuracy: 101 }).success).toBe(false);
    expect(
      skillSchema.safeParse({
        ...base,
        accuracy: 100,
        additionalEffect: {
          stat: 'def',
          target: 'target',
          multiplier: 0.8,
          chance: 101,
          turns: 3,
        },
      }).success,
    ).toBe(false);
  });
});
