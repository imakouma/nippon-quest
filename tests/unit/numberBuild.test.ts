import { describe, expect, it } from 'vitest';
import {
  numberBuildPayloadSchema,
  numberBuildScore,
} from '../../src/questions/renderers/number-build/schema';

describe('number-build', () => {
  it('3モードの payload を検証する', () => {
    expect(
      numberBuildPayloadSchema.safeParse({
        mode: 'blocks',
        prompt: '23を つくろう',
        answer: 23,
        blocks: [10, 1],
        max: 99,
      }).success,
    ).toBe(true);
    expect(
      numberBuildPayloadSchema.safeParse({
        mode: 'keypad',
        prompt: '7 × 8 = ?',
        answer: 56,
      }).success,
    ).toBe(true);
    expect(
      numberBuildPayloadSchema.safeParse({
        mode: 'numberline',
        prompt: '0.75は どこ？',
        answer: 0.75,
        min: 0,
        max: 1,
        step: 0.05,
        tolerance: 0.05,
      }).success,
    ).toBe(true);
  });

  it('blocks と keypad は正解だけを1点にする', () => {
    const payload = numberBuildPayloadSchema.parse({
      mode: 'keypad',
      prompt: '7 × 8 = ?',
      answer: 56,
    });
    expect(numberBuildScore(payload, 56)).toBe(1);
    expect(numberBuildScore(payload, 55)).toBe(0);
  });

  it('numberline は許容誤差内を満点、外側を距離で減点する', () => {
    const payload = numberBuildPayloadSchema.parse({
      mode: 'numberline',
      prompt: '0.75は どこ？',
      answer: 0.75,
      min: 0,
      max: 1,
      step: 0.05,
      tolerance: 0.05,
    });
    expect(numberBuildScore(payload, 0.7)).toBe(1);
    expect(numberBuildScore(payload, 0.5)).toBeCloseTo(0.75);
    expect(numberBuildScore(payload, 0)).toBeCloseTo(0.25);
  });

  it('範囲外の正解を拒否する', () => {
    expect(
      numberBuildPayloadSchema.safeParse({
        mode: 'blocks',
        prompt: 'つくろう',
        answer: 100,
        blocks: [10, 1],
        max: 99,
      }).success,
    ).toBe(false);
  });
});
