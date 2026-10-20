import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import current from '../../content/balance/xp.json';
import { buildXpTables, heroXpMultiplier } from '../../scripts/gen-xp-table';

describe('経験値テーブル生成', () => {
  it('既存のLv1〜51を完全に維持する', () => {
    const generated = buildXpTables();
    expect(generated.hero.slice(0, 51)).toEqual(current.hero.slice(0, 51));
    expect(generated.monster.slice(0, 51)).toEqual(current.monster.slice(0, 51));
    const digest = (values: readonly number[]) =>
      createHash('sha256').update(JSON.stringify(values)).digest('hex');
    expect(digest(generated.hero.slice(0, 51))).toBe(
      '5174285efc4e71bb19c0ef09c410ddbee013e28b747e5d33f1f1c084d6c40a70',
    );
    expect(digest(generated.monster.slice(0, 51))).toBe(
      '7b2a9c4d5be38008a4d08ba657a022f9735e7236a4434f0e1feb9f08337b020b',
    );
  });

  it('主人公Lv200・仲間Lv100まで安全な累積XPを生成する', () => {
    const generated = buildXpTables();
    expect(generated.hero).toHaveLength(200);
    expect(generated.monster).toHaveLength(100);
    for (const table of [generated.hero, generated.monster]) {
      expect(table[0]).toBe(0);
      expect(
        table.every((xp, index) => Number.isSafeInteger(xp) && (index === 0 || xp > table[index - 1]!)),
      ).toBe(true);
    }
  });

  it('主人公Lv101以降の差分倍率を帯域ごとに上げる', () => {
    expect(heroXpMultiplier(100)).toBe(1);
    expect(heroXpMultiplier(101)).toBe(8);
    expect(heroXpMultiplier(120)).toBe(8);
    expect(heroXpMultiplier(121)).toBe(12);
    expect(heroXpMultiplier(151)).toBe(18);
    expect(heroXpMultiplier(181)).toBe(25);
    expect(heroXpMultiplier(200)).toBe(25);
  });
});
