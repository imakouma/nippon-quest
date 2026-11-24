import { z } from 'zod/v3';

export const skillEffectFields = {
  accuracy: z.number().min(0).max(100).optional(),
  additionalEffect: z
    .object({
      stat: z.enum(['atk', 'def']),
      target: z.enum(['self', 'target']),
      multiplier: z.number().positive(),
      chance: z.number().min(0).max(100),
      turns: z.number().int().positive(),
    })
    .optional(),
};
