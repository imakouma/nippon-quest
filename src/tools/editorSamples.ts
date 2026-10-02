import { questionBaseSchema, type QuestionBase } from '../questions/contracts';
import { getRenderer } from '../questions/renderers/registry';

/** URL共有・タブ間同期など、外部から来た値をエディタへ入れてよいか検証する。 */
export function validateEditorQuestion(raw: unknown): QuestionBase | null {
  const base = questionBaseSchema.safeParse(raw);
  if (!base.success) return null;
  const renderer = getRenderer(base.data.type);
  if (!renderer) return null;
  const payload = renderer.schema.safeParse(base.data.payload);
  return payload.success ? ({ ...base.data, payload: payload.data } as QuestionBase) : null;
}

/** JSONエディタでフォーム状態として安全に扱える最小条件。不完全な項目は後段で詳しく表示する。 */
export function isEditorQuestionDraft(raw: unknown): raw is QuestionBase {
  return !!raw && typeof raw === 'object' && !Array.isArray(raw);
}

/** Webエディタを開いた直後から、現行レンダラーで試せる有効なサンプル。 */
export const SAMPLE_QUESTIONS: QuestionBase[] = [
  {
    id: 'sansu.g1.tashizan.0001',
    type: 'choice',
    subject: 'sansu',
    grade: 1,
    unit: 'sansu.g1.tashizan',
    timeLimitSec: 20,
    tags: ['たしざん', '基本'],
    explanation: '3 と 4 を あわせると 7 に なります。',
    payload: {
      prompt: '3 + 4 = ?',
      choices: [
        { id: 'five', text: '5' },
        { id: 'six', text: '6' },
        { id: 'seven', text: '7' },
        { id: 'eight', text: '8' },
      ],
      answer: 'seven',
    },
  },
  {
    id: 'eigo.g1.alphabet.0001',
    type: 'picture-word',
    subject: 'eigo',
    grade: 1,
    unit: 'eigo.g1.alphabet',
    timeLimitSec: 20,
    tags: ['単語', 'くだもの'],
    explanation: 'apple（アップル）は 「りんご」です。',
    payload: {
      image: 'questions/eigo/apple.png',
      words: [
        { id: 'apple', text: 'apple', audio: 'questions/eigo/apple.mp3' },
        { id: 'banana', text: 'banana' },
        { id: 'orange', text: 'orange' },
      ],
      answer: 'apple',
    },
  },
];
