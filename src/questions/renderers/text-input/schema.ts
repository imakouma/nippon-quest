import { z } from 'zod';

export const textInputPayloadSchema = z.object({
  prompt: z.string().min(1),
  template: z.string().min(1).optional(),
  answers: z.array(z.string().min(1)).min(1).max(8),
  suffix: z.string().optional(),
  promptImage: z.string().optional(),
});
export type TextInputPayload = z.infer<typeof textInputPayloadSchema>;

export function normalizeInput(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, '').replace(/,/g, '');
}

export function textInputScore(payload: TextInputPayload, values: string[]): number {
  if (values.length !== payload.answers.length) return 0;
  const correct = values.filter(
    (value, index) => normalizeInput(value) === normalizeInput(payload.answers[index]!),
  );
  return correct.length / payload.answers.length;
}
