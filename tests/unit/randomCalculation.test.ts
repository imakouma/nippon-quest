import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/core/rng';
import {
  randomCalculationSchema,
  defaultRandomCalculation,
} from '../../src/questions/renderers/random-calculation/schema';
import { generateAddition } from '../../src/questions/renderers/random-calculation/generate';

const rule = { ...defaultRandomCalculation, prompt: '1けたの たしざん' };

describe('random addition', () => {
  it('checks every single-digit pair and carry condition', () => {
    for (let left = 0; left <= 9; left++) {
      for (let right = 0; right <= 9; right++) {
        for (const carry of [false, true]) {
          const input = { ...rule, leftMin: left, leftMax: left, rightMin: right, rightMax: right, carry };
          const valid = left + right >= 10 === carry;
          expect(randomCalculationSchema.safeParse(input).success).toBe(valid);
          if (valid) {
            const result = generateAddition(input, createRng('pair'));
            expect(result).toMatchObject({ left, right, answer: left + right });
            expect(result.choices).toHaveLength(4);
            expect(new Set(result.choices).size).toBe(4);
            expect(result.choices.filter((n) => n === left + right)).toHaveLength(1);
            expect(result.choices.every((n) => Number.isInteger(n) && n >= 0 && n <= 18)).toBe(true);
          }
        }
      }
    }
  });

  it.each([
    { leftMin: -1 },
    { leftMax: 10 },
    { rightMin: 1.5 },
    { rightMax: Infinity },
    { leftMin: 8, leftMax: 3 },
    { rightMin: 7, rightMax: 2 },
    { leftMin: 9, rightMin: 9, carry: false },
    { leftMax: 2, rightMax: 2, carry: true },
    { response: 'unknown' },
    { operation: 'subtract' },
  ])('rejects impossible or malformed rules: %j', (change) => {
    expect(() => generateAddition({ ...rule, ...change }, createRng('bad'))).toThrow();
  });

  it('is repeatable with a seed and varies across a seeded sequence', () => {
    const first = createRng('replay');
    const second = createRng('replay');
    const series = Array.from({ length: 30 }, () => generateAddition(rule, first));
    expect(series).toEqual(Array.from({ length: 30 }, () => generateAddition(rule, second)));
    expect(new Set(series.map(({ left, right }) => `${left}+${right}`)).size).toBeGreaterThan(1);
    expect(series.every(({ answer }) => answer <= 9)).toBe(true);
  });
});
