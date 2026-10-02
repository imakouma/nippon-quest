import { z } from 'zod';

const prediction = z.object({
  prompt: z.string().min(1),
  choices: z
    .array(z.object({ id: z.string().min(1), text: z.string().min(1) }))
    .min(2)
    .max(4),
  answer: z.string().min(1),
});

const slider = z.object({
  id: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
  label: z.string().min(1),
  type: z.literal('slider'),
  min: z.number().finite(),
  max: z.number().finite(),
  step: z.number().positive(),
  unit: z.string().optional(),
});
const toggle = z.object({
  id: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
  label: z.string().min(1),
  type: z.literal('toggle'),
  offLabel: z.string().optional(),
  onLabel: z.string().optional(),
});

export const experimentPayloadSchema = z
  .object({
    title: z.string().min(1),
    predict: prediction,
    controls: z
      .array(z.discriminatedUnion('type', [slider, toggle]))
      .min(1)
      .max(4),
    outcome: z.object({
      formula: z.string().min(1),
      label: z.string().min(1),
      unit: z.string().default(''),
      visual: z.enum(['thermometer', 'beaker', 'pendulum', 'circuit', 'plant', 'scale']),
      visualRange: z.tuple([z.number().finite(), z.number().finite()]),
    }),
    requiredRuns: z.number().int().min(1).max(5).default(2),
  })
  .superRefine((payload, ctx) => {
    if (!payload.predict.choices.some((choice) => choice.id === payload.predict.answer))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['predict', 'answer'],
        message: 'answer が choices にありません',
      });
    if (new Set(payload.predict.choices.map((choice) => choice.id)).size !== payload.predict.choices.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['predict', 'choices'],
        message: 'choice.id が重複しています',
      });
    const ids = payload.controls.map((control) => control.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['controls'],
        message: 'control.id が重複しています',
      });
    for (const [index, control] of payload.controls.entries())
      if (control.type === 'slider' && control.max <= control.min)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['controls', index, 'max'],
          message: 'max は min より大きくしてください',
        });
    if (payload.outcome.visualRange[1] <= payload.outcome.visualRange[0])
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outcome', 'visualRange'],
        message: '右の値は左より大きくしてください',
      });
  });

export type ExperimentPayload = z.infer<typeof experimentPayloadSchema>;
