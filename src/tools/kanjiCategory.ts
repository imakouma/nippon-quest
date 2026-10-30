import type { QuestionBase } from '../questions/contracts';
import { stripRuby } from '../ui/ruby';

export type KanjiCategory = 'reading' | 'writing' | 'review';

/** Ambiguous questions remain visible for review rather than being guessed. */
export function kanjiCategory(question: QuestionBase | null): KanjiCategory {
  if (!question) return 'review';
  const payload =
    question.payload && typeof question.payload === 'object'
      ? (question.payload as Record<string, unknown>)
      : {};
  if (question.type === 'kanji-trace') return payload.mode === 'reading' ? 'reading' : 'writing';
  const prompt =
    typeof payload?.prompt === 'string' ? stripRuby(payload.prompt, 'kanji').replace(/\s/g, '') : '';
  if (/読み方|読みがな|読み仮名|よみかた|よみがな|音読み|訓読み|おんよみ|くんよみ/.test(prompt))
    return 'reading';
  if (
    /正しい漢字|正しいかん字|正しいかんじ|ただしい漢字|ただしいかん字|ただしいかんじ|あてはまる漢字|漢字の組み合わせ/.test(
      prompt,
    )
  )
    return 'writing';
  if (
    question.unit.includes('-kanji-') &&
    Array.isArray(payload.choices) &&
    payload.choices.length > 0 &&
    payload.choices.every(
      (choice: { text?: unknown } | null) =>
        choice && typeof choice.text === 'string' && /^[ぁ-ゖー\s]+$/.test(choice.text),
    )
  )
    return 'reading';
  return 'review';
}
