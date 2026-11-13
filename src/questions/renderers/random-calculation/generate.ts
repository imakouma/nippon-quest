import type { Rng } from '../../../core/rng';
import { randomCalculationSchema } from './schema';

export function generateAddition(input: unknown, rng: Rng) {
  const rule = randomCalculationSchema.parse(input);
  const pairs: { left: number; right: number }[] = [];
  for (let left = rule.leftMin; left <= rule.leftMax; left++) {
    for (let right = rule.rightMin; right <= rule.rightMax; right++) {
      if (left + right >= 10 === rule.carry) pairs.push({ left, right });
    }
  }
  const { left, right } = rng.pick(pairs);
  const answer = left + right;
  const distractors = Array.from({ length: rule.carry ? 9 : 10 }, (_, i) => i + (rule.carry ? 10 : 0)).filter(
    (n) => n !== answer,
  );
  const choices = [answer];
  for (let i = 0; i < 3; i++) choices.push(distractors.splice(rng.int(0, distractors.length - 1), 1)[0]!);
  for (let i = choices.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [choices[i], choices[j]] = [choices[j]!, choices[i]!];
  }
  return { left, right, answer, choices };
}
