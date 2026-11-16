import { z } from 'zod/v3';
const variantsByCharacter: Record<string, readonly string[]> = {
  貴: ['とうと', 'たっと'],
  尊: ['とうと', 'たっと'],
  私: ['わたし', 'わたくし'],
  得: ['え', 'う'],
};

export const textInputPayloadSchema = z.object({
  prompt: z.string().min(1),
  template: z.string().min(1).optional(),
  answers: z.array(z.string().min(1)).min(1).max(8),
  suffix: z.string().optional(),
  promptImage: z.string().optional(),
  promptImageAlt: z.string().min(1).optional(),
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
  const characters = payload.prompt.match(/\p{Script=Han}/gu);
  const variants =
    payload.answers.length === 1 &&
    characters?.length === 1 &&
    (characters[0] !== '得' || payload.prompt.includes('得る'))
      ? variantsByCharacter[characters[0]!]
      : undefined;
  const correct = values.filter((value, index) => {
    const actual = normalizeAnswer(value);
    const expected = normalizeAnswer(payload.answers[index]!);
    return actual === expected || (variants?.includes(expected) && variants.includes(actual));
  });
  return correct.length / payload.answers.length;
}
