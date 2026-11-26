import { describe, expect, it } from 'vitest';
import { canUseMusubiDama, musubiDamaChance, rollMusubiDama } from '../../src/core/battle/musubiDama';

const attempt = {
  baseRate: 0.2,
  hpRatio: 0.5,
  score: 1,
  timeMs: 15_000,
  timeLimitScale: 1,
};

describe('むすび玉の仲間化確率', () => {
  it('４段階判定で０〜３回の揺れと成功を決める', () => {
    for (let failed = 0; failed < 4; failed++) {
      const rolls = Array(failed).fill(true).concat(false);
      expect(rollMusubiDama(0.5, { chance: () => rolls.shift()! })).toEqual({
        success: false,
        shakes: failed,
      });
    }
    const thresholds: number[] = [];
    expect(rollMusubiDama(0.5, { chance: (p) => (thresholds.push(p), true) })).toEqual({
      success: true,
      shakes: 3,
    });
    expect(thresholds).toHaveLength(4);
    expect(thresholds[0] ** 4).toBeCloseTo(0.5);
    expect(rollMusubiDama(0, { chance: () => true })).toEqual({ success: false, shakes: 0 });
  });
  it('HPが低いほど成功率が上がる', () => {
    expect(musubiDamaChance({ ...attempt, hpRatio: 0.1 })).toBeGreaterThan(
      musubiDamaChance({ ...attempt, hpRatio: 0.9 }),
    );
  });

  it('HP補正は (3 × 最大HP − 2 × 現在HP) / (3 × 最大HP)', () => {
    const input = { ...attempt, baseRate: 0.6, score: 1, timeMs: 15_000 };
    expect(musubiDamaChance({ ...input, hpRatio: 1 })).toBeCloseTo(0.2);
    expect(musubiDamaChance({ ...input, hpRatio: 0.5 })).toBeCloseTo(0.4);
    expect(musubiDamaChance({ ...input, hpRatio: 0.01 })).toBeCloseTo(0.596);
  });

  it('正解度が高いほど成功率が上がり、不正解は0%', () => {
    expect(musubiDamaChance({ ...attempt, score: 1 })).toBeGreaterThan(
      musubiDamaChance({ ...attempt, score: 0.5 }),
    );
    expect(musubiDamaChance({ ...attempt, score: 0 })).toBe(0);
  });

  it('速い正解は最大40%の加点、15秒以降は減点しない', () => {
    const normal = musubiDamaChance(attempt);
    expect(musubiDamaChance({ ...attempt, timeMs: 0 })).toBeCloseTo(normal * 1.4);
    expect(musubiDamaChance({ ...attempt, timeMs: 30_000 })).toBe(normal);
  });

  it('アクセシビリティ倍率にあわせて速さ判定の基準を伸ばす', () => {
    expect(musubiDamaChance({ ...attempt, timeMs: 15_000, timeLimitScale: 2 })).toBeGreaterThan(
      musubiDamaChance({ ...attempt, timeMs: 15_000, timeLimitScale: 1 }),
    );
  });

  it('成功率は100%を超えない', () => {
    expect(musubiDamaChance({ ...attempt, baseRate: 1, hpRatio: 0, timeMs: 0 })).toBe(1);
  });

  it('ボス・加入率0・倒れた敵には使えない', () => {
    expect(canUseMusubiDama({ isBoss: true, hp: 1, recruitRate: 0.2 })).toBe(false);
    expect(canUseMusubiDama({ isBoss: false, hp: 1, recruitRate: 0 })).toBe(false);
    expect(canUseMusubiDama({ isBoss: false, hp: 0, recruitRate: 0.2 })).toBe(false);
  });
});
