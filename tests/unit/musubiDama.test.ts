import { describe, expect, it } from 'vitest';
import { canUseMusubiDama, musubiDamaChance } from '../../src/core/battle/musubiDama';

const attempt = {
  baseRate: 0.2,
  hpRatio: 0.5,
  score: 1,
  timeMs: 15_000,
  timeLimitScale: 1,
};

describe('むすび玉の仲間化確率', () => {
  it('HPが低いほど成功率が上がる', () => {
    expect(musubiDamaChance({ ...attempt, hpRatio: 0.1 })).toBeGreaterThan(
      musubiDamaChance({ ...attempt, hpRatio: 0.9 }),
    );
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

  it('成功率は90%を超えない', () => {
    expect(musubiDamaChance({ ...attempt, baseRate: 1, hpRatio: 0, timeMs: 0 })).toBe(0.9);
  });

  it('ボス・加入率0・倒れた敵には使えない', () => {
    expect(canUseMusubiDama({ isBoss: true, hp: 1, recruitRate: 0.2 })).toBe(false);
    expect(canUseMusubiDama({ isBoss: false, hp: 1, recruitRate: 0 })).toBe(false);
    expect(canUseMusubiDama({ isBoss: false, hp: 0, recruitRate: 0.2 })).toBe(false);
  });
});
