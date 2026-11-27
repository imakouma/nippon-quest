import { describe, expect, it } from 'vitest';
import math from '../../content/math-skills.json';
import kokugo from '../../content/kokugo-skills.json';
import rika from '../../content/rika-skills.json';
import shakai from '../../content/shakai-skills.json';
import seikatsu from '../../content/seikatsu-skills.json';
import eigo from '../../content/eigo-skills.json';

const skills = [...math, ...kokugo, ...rika, ...shakai, ...seikatsu, ...eigo];
const ranges = [
  [20, 60],
  [60, 100],
  [100, 150],
  [150, 210],
  [210, 280],
  [280, 360],
] as const;

describe('学年と学習時期に応じた技の威力', () => {
  it('単一学年の技は学年の目安に沿い、チャージ技には上乗せを認める', () => {
    for (const skill of skills) {
      const [first, last] = skill.gradeRange;
      if (first === undefined || first !== last || first < 1 || first > 6) continue;
      const [min, max] = ranges[first - 1]!;
      expect(skill.power, skill.id).toBeGreaterThanOrEqual(min);
      expect(skill.power, skill.id).toBeLessThanOrEqual(skill.costGauge === 50 ? Math.ceil(max * 1.3) : max);
    }
  });

  it('学習前半と後半の代表的な技が指定の目安に沿う', () => {
    const power = (id: string) => skills.find((skill) => skill.id === id)!.power;
    expect(power('sk-seikatsu-school')).toBe(20);
    expect(power('sk-seikatsu-growth')).toBe(60);
    expect(power('sk-seikatsu-town')).toBe(60);
    expect(power('sk-seikatsu-future')).toBe(100);
    expect(power('sk-shakai-g3-map')).toBe(100);
    expect(power('sk-shakai-g3-change')).toBe(150);
    expect(power('sk-shakai-g4-region')).toBe(150);
    expect(power('sk-shakai-g4-heritage')).toBe(210);
    expect(power('sk-shakai-g5-world')).toBe(210);
    expect(power('sk-shakai-g5-information')).toBe(280);
    expect(power('sk-shakai-g6-constitution')).toBe(280);
    expect(power('sk-shakai-g6-modern')).toBe(360);
  });
});

it('チャージのある技や追加効果を考慮して威力に差をつける', () => {
  const power = (id: string) => skills.find((skill) => skill.id === id)!.power;
  expect(power('sk-math-1-08')).toBeGreaterThan(30);
  expect(power('sk-math-4-05')).toBeGreaterThan(150);
  expect(power('sk-eigo-direction')).toBeGreaterThan(210);
  const leafStorm = seikatsu.find((skill) => skill.id === 'sk-happa-arashi')!;
  expect(leafStorm.additionalEffect).toMatchObject({ stat: 'atk', target: 'self', chance: 30 });
  expect(leafStorm.power).toBeLessThan(70);
  const safety = shakai.find((skill) => skill.id === 'sk-shakai-g3-safety')!;
  expect(safety.power).toBeLessThan(power('sk-shakai-g3-work'));
  expect(safety.additionalEffect).toMatchObject({ stat: 'def', target: 'self' });
  const typhoon = rika.find((skill) => skill.id === 'sk-rika-g5-typhoon')!;
  expect(typhoon.power).toBeLessThan(power('sk-rika-g5-river'));
  expect(typhoon.additionalEffect).toMatchObject({ stat: 'def', target: 'self' });
});
