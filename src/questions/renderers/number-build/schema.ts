import { z } from 'zod';

const common = {
  prompt: z.string().min(1).describe('問題文（RubyText）'),
  answer: z.number().finite(),
};

const blocks = z.object({
  ...common,
  mode: z.literal('blocks'),
  blocks: z.array(z.number().int().positive()).min(1).max(4),
  max: z.number().int().positive(),
});

const keypad = z.object({
  ...common,
  mode: z.literal('keypad'),
  maxDigits: z.number().int().min(1).max(8).default(6),
});

const numberline = z.object({
  ...common,
  mode: z.literal('numberline'),
  min: z.number().finite(),
  max: z.number().finite(),
  step: z.number().positive(),
  tolerance: z.number().nonnegative().default(0),
  labels: z.array(z.string()).length(2).optional(),
});

export const numberBuildPayloadSchema = z
  .discriminatedUnion('mode', [blocks, keypad, numberline])
  .superRefine((payload, ctx) => {
    if (payload.mode === 'blocks' && (payload.answer < 0 || payload.answer > payload.max))
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'answer は 0 以上 max 以下にしてください' });
    if (payload.mode === 'numberline') {
      if (payload.max <= payload.min)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'max は min より大きくしてください' });
      if (payload.answer < payload.min || payload.answer > payload.max)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'answer は min 以上 max 以下にしてください' });
    }
  });
export type NumberBuildPayload = z.infer<typeof numberBuildPayloadSchema>;

export function numberBuildScore(payload: NumberBuildPayload, value: number): number {
  const difference = Math.abs(value - payload.answer);
  if (payload.mode !== 'numberline') return difference < 1e-9 ? 1 : 0;
  if (difference <= payload.tolerance + 1e-9) return 1;
  const range = payload.max - payload.min;
  return Math.max(0, Math.min(1, 1 - difference / range));
}
