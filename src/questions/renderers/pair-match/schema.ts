import { z } from 'zod/v3';

const face = z
  .object({
    text: z.string().min(1).optional().describe('RubyText'),
    image: z.string().min(1).optional().describe('assets/ からの相対パス'),
  })
  .refine((value) => value.text || value.image, { message: 'text か image の どちらかが ひつようです' });

export const pairMatchPayloadSchema = z.object({
  prompt: z.string().min(1).describe('問題文（RubyText）'),
  pairs: z
    .array(z.object({ a: face, b: face }))
    .min(2)
    .max(6),
  faceDown: z.boolean().default(true),
});

export type PairMatchPayload = z.infer<typeof pairMatchPayloadSchema>;
export type PairFace = PairMatchPayload['pairs'][number]['a'];

export const pairMatchScore = (misses: number, pairs: number) => Math.max(0, 1 - misses / (pairs * 2));
