import { z } from 'zod/v3';

export const gradeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
export const gradeRangeSchema = z
  .tuple([gradeSchema, gradeSchema])
  .refine(([a, b]) => a <= b, 'gradeRange は [小, 大]');
