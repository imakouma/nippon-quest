import { z } from 'zod/v3';

const digit = z.number().int().min(0).max(9);
export const randomCalculationSchema = z
  .object({
    prompt: z.string().min(1),
    operation: z.literal('add'),
    leftMin: digit,
    leftMax: digit,
    rightMin: digit,
    rightMax: digit,
    carry: z.boolean(),
    response: z.enum(['choice', 'text-input']),
  })
  .strict()
  .refine(
    (rule) =>
      rule.leftMin <= rule.leftMax &&
      rule.rightMin <= rule.rightMax &&
      (rule.carry ? rule.leftMax + rule.rightMax >= 10 : rule.leftMin + rule.rightMin <= 9),
    { message: 'invalid_addition_range' },
  );

export type RandomCalculationPayload = z.infer<typeof randomCalculationSchema>;
export const defaultRandomCalculation = {
  operation: 'add',
  leftMin: 1,
  leftMax: 9,
  rightMin: 1,
  rightMax: 9,
  carry: false,
  response: 'text-input',
} as const;
