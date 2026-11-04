import { z } from 'zod/v3';

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

function normalizeAnswer(value: string): string {
  const normalized = normalizeInput(value);
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(normalized);
  if (!match) return normalized;
  const integer = match[2]!.replace(/^0+/, '') || '0';
  const fraction = (match[3] ?? '').replace(/0+$/, '');
  const sign = match[1] === '-' && (integer !== '0' || fraction !== '') ? '-' : '';
  return sign + integer + (fraction ? `.${fraction}` : '');
}

export function textInputScore(payload: TextInputPayload, values: string[]): number {
  if (values.length !== payload.answers.length) return 0;
  const correct = values.filter(
    (value, index) => normalizeAnswer(value) === normalizeAnswer(payload.answers[index]!),
  );
  return correct.length / payload.answers.length;
}
