import { describe, expect, it } from 'vitest';
import {
  numberBuildPayloadSchema,
  numberBuildScore,
} from '../../src/questions/renderers/number-build/schema';
import { numberLineTicks, splitPlaceValue } from '../../src/questions/renderers/number-build/NumberBuildView';

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

  it('23を10のまとまり2つと1のばら3つに分ける', () => {
    expect(splitPlaceValue(23)).toEqual({ tens: 2, ones: 3 });
  });

  it('0〜10は全11目盛りにし、長い数直線は主要目盛りへ間引く', () => {
    expect(numberLineTicks(0, 10, 1)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const long = numberLineTicks(0, 100, 1);
    expect(long.length).toBeLessThanOrEqual(12);
    expect(long.at(0)).toBe(0);
    expect(long.at(-1)).toBe(100);
  });
});
