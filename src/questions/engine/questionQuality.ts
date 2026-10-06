import type { QuestionBase } from '../contracts';

const CONCRETE_MATH = /[0-9０-９一二三四五六七八九十百千万億兆+＋\-－−×÷=＝]/;

/**
 * 旧教材の入力問題には、移行元の式や図が欠けて「計算しましょう」と答え欄だけになるものがある。
 * 回答に必要な表示材料がない問題は、ゲーム内の出題候補へ入れない。
 */
export function questionHasAnswerContext(question: QuestionBase): boolean {
  if (question.type !== 'text-input') return true;
  const payload = question.payload as Record<string, unknown>;
  if (typeof payload.template === 'string' && payload.template.replaceAll('{{INPUT}}', '').trim())
    return true;
  if (typeof payload.promptImage === 'string' && payload.promptImage.trim()) return true;
  if (question.subject !== 'sansu') return true;
  const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
  return CONCRETE_MATH.test(prompt);
}
