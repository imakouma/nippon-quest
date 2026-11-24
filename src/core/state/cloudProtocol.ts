import { z } from 'zod/v3';
import { gameStateSchema, SCHEMA_VERSION } from './schema';

export const cloudWriteSchema = z
  .object({
    revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    mutation: z.string().uuid(),
    state: gameStateSchema
      .refine((state) => state.schemaVersion === SCHEMA_VERSION, 'Unsupported save version')
      .nullable(),
  })
  .strict();
export const cloudSlotSchema = cloudWriteSchema.extend({
  slot: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
export type CloudWrite = z.infer<typeof cloudWriteSchema>;
export type CloudSlot = z.infer<typeof cloudSlotSchema>;
export const MAX_CLOUD_BYTES = 5 * 1024 * 1024;
