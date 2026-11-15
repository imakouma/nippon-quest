import { z } from 'zod/v3';
import { validRule, stages, type Operation } from './rules';
import type { QuestionBase } from '../../contracts';

const digit = z.number().int().min(0).max(9999);
export const randomCalculationSchema = z
  .object({
    prompt: z.string().min(1),
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    stage: z
      .enum([
        'digit',
        'twenty',
        'twoDigits',
        'hundreds',
        'kuku',
        'tensMultiply',
        'threeDigits',
        'fourDigits',
        'twoByOne',
        'threeByOne',
        'twoByTwo',
        'division',
        'divisionTens',
      ])
      .optional(),
    remainder: z.boolean().optional(),
    leftMin: digit,
    leftMax: digit,
    rightMin: digit,
    rightMax: digit,
    carry: z.boolean(),
    response: z.enum(['choice', 'text-input']),
  })
  .strict()
  .refine(validRule, { message: 'invalid_addition_range' });

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

export function calculationProblem(
  question: Pick<QuestionBase, 'type' | 'subject' | 'grade' | 'unit'> & { payload?: unknown },
): string | null {
  if (question.type !== 'random-calculation') return null;
  const parsed = randomCalculationSchema.safeParse(question.payload);
  if (!parsed.success) return 'invalid_calculation_rule';
  const rule = parsed.data;
  const stage = stages.find((s) => s.id === (rule.stage ?? 'digit'))!;
  if (
    question.subject !== 'sansu' ||
    question.grade < stage.grade ||
    question.grade > 3 ||
    !question.unit.startsWith(`sansu.g${question.grade}.`)
  )
    return 'invalid_calculation_grade';
  if (!operationsForQuestion(question).includes(rule.operation)) return 'invalid_calculation_unit';
  return null;
}
export function operationsForQuestion(
  question: Pick<QuestionBase, 'subject' | 'grade' | 'unit'>,
): Operation[] {
  if (
    question.subject !== 'sansu' ||
    question.grade < 1 ||
    question.grade > 3 ||
    !question.unit.startsWith(`sansu.g${question.grade}.`)
  )
    return [];
  const operations: Record<string, Operation[]> = {
    tashizan: ['add'],
    hikizan: ['subtract'],
    'kuriagari-kurisagari': ['add', 'subtract'],
    'kazu-20': ['add', 'subtract'],
    warizan: ['divide'],
    'random-calculation': ['add', 'subtract', 'multiply', 'divide'],
  };
  return (operations[question.unit.split('.').at(-1)!] ?? []).filter((op) =>
    op === 'multiply' ? question.grade >= 2 : op === 'divide' ? question.grade >= 3 : true,
  );
}
