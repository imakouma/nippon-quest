import { describe, expect, it } from 'vitest';
import {
  BALANCE_LEVELS,
  combatPressure,
  legacyDamage,
  legacyStatsAtLevel,
  median,
  relativeDrift,
} from '../../scripts/battle-balance-model';

describe('戦闘バランス監査モデル', () => {
  it('序盤・節目・終盤を同じ固定レベル集合で比較する', () => {
    expect(BALANCE_LEVELS).toEqual([1, 5, 10, 20, 35, 50]);
  });

  it('変更前の実データを旧成長式と旧ダメージ式で再現する', () => {
    const stats = legacyStatsAtLevel(
      { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 },
      { hp: 4, mp: 1, atk: 1, def: 0.8, spd: 0.6, wis: 0 },
      5,
    );
    expect(stats).toEqual({ hp: 56, mp: 14, atk: 12, def: 9, spd: 9, wis: 5 });
    expect(
      legacyDamage({ attack: 12, defense: 9, wisdom: 5, power: 120, scoreMultiplier: 2, scale: 12 }),
    ).toBe(40);
  });

  it('中央値と変更前後の相対差をゼロ除算なしで求める', () => {
    expect(median([9, 1, 5, 3])).toBe(4);
    expect(relativeDrift(10, 12)).toBeCloseTo(0.2);
    expect(relativeDrift(0, 0)).toBe(0);
    expect(combatPressure(8, 4)).toBe(2);
  });
});
