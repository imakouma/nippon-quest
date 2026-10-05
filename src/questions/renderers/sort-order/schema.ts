import { z } from 'zod';

const card = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  image: z.string().min(1).optional(),
});

export const sortOrderPayloadSchema = z
  .object({
    prompt: z.string().min(1),
    direction: z.enum(['horizontal', 'vertical']).default('horizontal'),
    cards: z.array(card).min(2).max(8),
    answer: z.array(z.string().min(1)).min(2).max(8),
  })
  .superRefine((value, ctx) => {
    const ids = value.cards.map(({ id }) => id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'cards の id は重複できません' });
    if (value.answer.length !== ids.length || new Set(value.answer).size !== ids.length)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'answer は全カードを一度ずつ含めてください' });
    if (value.answer.some((id) => !ids.includes(id)))
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'answer に存在しないカードがあります' });
  });

export type SortOrderPayload = z.infer<typeof sortOrderPayloadSchema>;
export const sortOrderScore = (order: string[], answer: string[]) =>
  order.filter((id, index) => id === answer[index]).length / answer.length;
