import type { QuestionBase } from '../contracts';

const CONCRETE_MATH = /[0-9０-９一二三四五六七八九十百千万億兆+＋\-－−×÷=＝]/;
// shortcut: 既知の定型文のみ検出、別の欠落文が見つかったら判定を追加する。
const MISSING_CHOICE_CONTEXT = new Set([
  'つぎの数の 読みかたとして、正しいものを えらぼう。',
  'つぎのけいさんについて、はじめにけいさんするのは、どこでしょう。',
  'つぎのかけ算のしきと 同じことをあらわす たし算のしきを えらぼう。',
  '次の文章題の答えを求める式として、正しいものをえらぼう。',
  '次の式をまとめて計算すると、どういう式になるでしょう。',
  '次の文章題の答えを □として、答えを求める □の入った式 をつくろう。',
  '次の数をよみましょう。',
  '次の数をくらべたとき、□に入る きごう をえらぼう。',
  '次の２つの数をくらべたとき、□に入る きごう をえらぼう。',
  '次の長さの計算を しましょう。',
]);
export const MISSING_CONTEXT_QUARANTINE_TAG = 'runtime:quarantined-missing-context';

/**
 * 旧教材には、移行元の式や図が欠けて指示文と答え欄だけになるものがある。
 * 回答に必要な表示材料がない問題は、ゲーム内の出題候補へ入れない。
 */
export function questionHasAnswerContext(question: QuestionBase): boolean {
  if (question.type === 'choice' && question.subject === 'sansu') {
    const payload = question.payload as Record<string, unknown>;
    if (typeof payload.promptImage === 'string' && payload.promptImage.trim()) return true;
    const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
    return !MISSING_CHOICE_CONTEXT.has(prompt.trim());
  }
  if (question.type !== 'text-input') return true;
  const payload = question.payload as Record<string, unknown>;
  if (typeof payload.template === 'string' && payload.template.replaceAll('{{INPUT}}', '').trim())
    return true;
  if (typeof payload.promptImage === 'string' && payload.promptImage.trim()) return true;
  if (question.subject !== 'sansu') return true;
  const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
  return CONCRETE_MATH.test(prompt);
}

/** 移行元にも式・図が残っておらず、教材担当の再作成待ちであることを明示した問題。 */
export function questionIsMissingContextQuarantined(question: QuestionBase): boolean {
  return Boolean(
    question.tags?.includes('source:legacy-autonomy-game') &&
    question.tags.includes(MISSING_CONTEXT_QUARANTINE_TAG),
  );
}
