import { z } from 'zod';

const choiceOption = z
  .object({
    id: z.string().min(1),
    text: z.string().optional().describe('RubyText'),
    image: z.string().optional().describe('assets/ からの相対パス。例 questions/eigo/apple.png'),
    audio: z.string().optional(),
  })
  .refine((c) => c.text || c.image, '選択肢には text か image が必要');

export const choicePayloadSchema = z.object({
  prompt: z.string().min(1).describe('問題文（RubyText）'),
  promptImage: z.string().optional(),
  promptAudio: z.string().optional(),
  choices: z.array(choiceOption).min(2).max(6),
  answer: z.string().min(1).describe('正解の choice.id'),
  shuffle: z.boolean().default(true),
});

export type ChoicePayload = z.infer<typeof choicePayloadSchema>;
