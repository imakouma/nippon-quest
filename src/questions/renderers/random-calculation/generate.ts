import type { Rng } from '../../../core/rng';
import { randomCalculationSchema } from './schema';
import { rightCount } from './rules';

export function generateCalculation(input: unknown, rng: Rng) {
  const rule = randomCalculationSchema.parse(input);
  const rows = [];
  for (let left = rule.leftMin; left <= rule.leftMax; left++) {
    const weight = rightCount(rule, left);
    if (weight) rows.push({ item: left, weight });
  }
  const left = rng.weighted(rows);
  const rank = rng.int(1, rightCount(rule, left));
  let low = rule.rightMin,
    high = rule.rightMax;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (rightCount(rule, left, middle) >= rank) high = middle;
    else low = middle + 1;
  }
  const right = low;
  const answer =
    rule.operation === 'add'
      ? left + right
      : rule.operation === 'subtract'
        ? left - right
        : rule.operation === 'multiply'
          ? left * right
          : Math.floor(left / right);
  const remainder = rule.operation === 'divide' ? left % right : 0;
  const maximum =
    (rule.stage ?? 'digit') === 'digit' && rule.operation === 'add' ? (rule.carry ? 18 : 9) : Infinity;
  const choices = [{ answer, remainder }];
  // Neighboring nonnegative answers keep large-number choices readable; exactly one pair is correct.
  for (let offset = 1; choices.length < 4; offset++) {
    if (answer - offset >= 0) choices.push({ answer: answer - offset, remainder });
    if (choices.length < 4 && answer + offset <= maximum)
      choices.push({ answer: answer + offset, remainder });
  }
  if (rule.remainder) choices[1] = { answer, remainder: (remainder + 1) % right };
  for (let i = choices.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [choices[i], choices[j]] = [choices[j]!, choices[i]!];
  }
  return { left, right, answer, remainder, choices };
}
