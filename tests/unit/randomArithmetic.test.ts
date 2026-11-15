import { expect, it } from 'vitest';
import { createRng } from '../../src/core/rng';
import { generateCalculation } from '../../src/questions/renderers/random-calculation/generate';
import { stages, stageDefaults } from '../../src/questions/renderers/random-calculation/rules';
import {
  randomCalculationSchema,
  calculationProblem,
} from '../../src/questions/renderers/random-calculation/schema';

it('all stages generate valid bounded arithmetic, including remainders', () => {
  for (const stage of stages)
    for (const operation of stage.operations) {
      for (const carry of [false, true])
        for (const remainder of [false, true]) {
          const rule = { ...stageDefaults(stage.id, operation), carry, remainder, prompt: 'けいさん' };
          if (!randomCalculationSchema.safeParse(rule).success) continue;
          for (let seed = 0; seed < 12; seed++) {
            const result = generateCalculation(rule, createRng(seed));
            expect(result.left).toBeGreaterThanOrEqual(rule.leftMin);
            expect(result.left).toBeLessThanOrEqual(rule.leftMax);
            expect(result.right).toBeGreaterThanOrEqual(rule.rightMin);
            expect(result.right).toBeLessThanOrEqual(rule.rightMax);
            expect(result.answer).toBeGreaterThanOrEqual(0);
            if (operation === 'add') expect(result.answer).toBe(result.left + result.right);
            if (operation === 'subtract') expect(result.answer).toBe(result.left - result.right);
            if (operation === 'multiply') expect(result.answer).toBe(result.left * result.right);
            if (operation === 'divide') {
              expect(result.right).toBeGreaterThan(0);
              expect(result.right * result.answer + result.remainder).toBe(result.left);
              expect(result.remainder).toBeLessThan(result.right);
              expect(result.remainder > 0).toBe(remainder);
            }
            expect(result.choices).toHaveLength(4);
            expect(new Set(result.choices.map((c) => `${c.answer}:${c.remainder}`)).size).toBe(4);
            expect(
              result.choices.filter((c) => c.answer === result.answer && c.remainder === result.remainder),
            ).toHaveLength(1);
          }
        }
    }
});
it('rejects future grades and mismatching arithmetic units', () => {
  const payload = { ...stageDefaults('division', 'divide'), prompt: 'わりざん' };
  expect(
    calculationProblem({
      type: 'random-calculation',
      subject: 'sansu',
      grade: 2,
      unit: 'sansu.g2.random-calculation',
      payload,
    }),
  ).toBeTruthy();
  expect(
    calculationProblem({
      type: 'random-calculation',
      subject: 'sansu',
      grade: 3,
      unit: 'sansu.g3.warizan',
      payload,
    }),
  ).toBeNull();
  expect(
    calculationProblem({
      type: 'random-calculation',
      subject: 'sansu',
      grade: 3,
      unit: 'sansu.g3.tashizan',
      payload,
    }),
  ).toBeTruthy();
});
it('rejects zero division and impossible remainder settings', () => {
  const rule = { ...stageDefaults('division', 'divide'), prompt: 'わりざん' };
  expect(randomCalculationSchema.safeParse({ ...rule, rightMin: 0 }).success).toBe(false);
  expect(
    randomCalculationSchema.safeParse({ ...rule, rightMin: 1, rightMax: 1, remainder: true }).success,
  ).toBe(false);
  expect(
    randomCalculationSchema.safeParse({
      ...rule,
      leftMin: 8,
      leftMax: 8,
      rightMin: 3,
      rightMax: 3,
      remainder: false,
    }).success,
  ).toBe(false);
});
it('handles 4-digit boundary and deterministic generation', () => {
  const rule = {
    ...stageDefaults('fourDigits', 'subtract'),
    prompt: 'けいさん',
    leftMin: 1000,
    leftMax: 1000,
    rightMin: 1,
    rightMax: 1,
    carry: true,
  };
  expect(generateCalculation(rule, createRng('a'))).toMatchObject({ left: 1000, right: 1, answer: 999 });
  expect(generateCalculation(rule, createRng('a'))).toEqual(generateCalculation(rule, createRng('a')));
});

it('digit counting agrees with exhaustive regrouping and borrowing checks', async () => {
  const { rightCount } = await import('../../src/questions/renderers/random-calculation/rules');
  for (const operation of ['add', 'subtract'] as const)
    for (const carry of [false, true]) {
      const rule = { ...stageDefaults('twoDigits', operation), leftMin: 0, rightMin: 0, carry };
      for (let left = 0; left <= 99; left++) {
        const valid = Array.from({ length: 100 }, (_, right) => right).filter((right) => {
          if (operation === 'subtract' && right > left) return false;
          const regroup =
            operation === 'add'
              ? (left % 10) + (right % 10) >= 10 || Math.floor(left / 10) + Math.floor(right / 10) >= 10
              : left % 10 < right % 10 || Math.floor(left / 10) < Math.floor(right / 10);
          return regroup === carry;
        });
        expect(rightCount(rule, left)).toBe(valid.length);
        expect(rightCount(rule, left, 43)).toBe(valid.filter((n) => n <= 43).length);
      }
    }
});

it('save and bank reject rules beyond the owning grade without changing source data', async () => {
  const { replaceQuestionForSave } = await import('../../src/tools/questionSave');
  const { QuestionBank } = await import('../../src/questions/engine/bank');
  const source = {
    id: 'sansu.g2.random.test',
    type: 'random-calculation',
    subject: 'sansu',
    grade: 2,
    unit: 'sansu.g2.random-calculation',
    payload: { ...stageDefaults('kuku', 'multiply'), prompt: 'けいさん' },
  };
  const invalid = { ...source, payload: { ...stageDefaults('division', 'divide'), prompt: 'けいさん' } };
  expect(() => replaceQuestionForSave([source], [source], source.id, invalid)).toThrow();
  const { bank, report } = await QuestionBank.load(['test.json'], async () => [
    source,
    { ...invalid, id: 'sansu.g2.random.bad' },
  ]);
  expect(bank.size).toBe(1);
  expect(report.skipped).toHaveLength(1);
  expect(source.payload.operation).toBe('multiply');
});
