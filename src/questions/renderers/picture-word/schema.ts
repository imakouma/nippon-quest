import { z } from 'zod';
import { PICTURE_KEYS } from '../shared/pictures';

const word = z.object({
  id: z.string().min(1),
  text: z.string().min(1).describe('英単語（日本語訳は 書かない）'),
  audio: z.string().optional().describe('単語の音声。assets/ からの相対パス。例 audio/words/apple.mp3'),
});

export const pictureWordPayloadSchema = z
  .object({
    mode: z.literal('image-to-word').default('image-to-word').describe('いまは 絵 → 単語 だけ'),
    prompt: z
      .string()
      .optional()
      .describe('問題文（RubyText）。省略すると「この えに あう えいごは どれ？」'),
    picture: z
      .enum(PICTURE_KEYS)
      .optional()
      .describe('レンダラーが 描く 仮の絵（renderers/shared/pictures.ts）'),
    image: z
      .string()
      .optional()
      .describe(
        '本番の絵。assets/ からの相対パス。例 questions/eigo/apple.png（読めなければ picture を出す）',
      ),
    words: z.array(word).min(2).max(4),
    answer: z.string().min(1).describe('正解の words[].id'),
    shuffle: z.boolean().default(true),
  })
  .refine((p) => p.picture || p.image, '絵（picture か image）が必要')
  .refine((p) => p.words.some((w) => w.id === p.answer), 'answer が words の id に ありません')
  .refine((p) => new Set(p.words.map((w) => w.id)).size === p.words.length, 'words の id が 重複しています');

export type PictureWordPayload = z.infer<typeof pictureWordPayloadSchema>;

/** この回数 まちがえたら おわり（正解を 見せる） */
export const MAX_MISSES = 2;

/** GDD §4.2：1 回目で 正解 1.0、2 回目 0.5、それより あとは 0 */
export const pictureWordScore = (misses: number): number => (misses === 0 ? 1 : misses === 1 ? 0.5 : 0);
