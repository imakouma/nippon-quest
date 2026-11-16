import { fractionSpeech } from '../../../ui/fraction';
import { stripRuby } from '../../../ui/ruby';
import { t } from '../../../ui/i18n';
import type { TextInputPayload } from '../text-input/schema';
import type { QuestionBase } from '../../contracts';

export function canSpeakPrompt(question: Pick<QuestionBase, 'tags'>): boolean {
  return !question.tags?.some((tag) => tag === 'speech:disabled' || tag.startsWith('kanji:reading:'));
}

export function mathSpeech(text: string): string {
  const symbols: Record<string, string> = {
    '+': 'plus',
    '＋': 'plus',
    '-': 'minus',
    '−': 'minus',
    '－': 'minus',
    '×': 'times',
    '÷': 'divide',
    '=': 'equals',
    '＝': 'equals',
    '□': 'blank',
  };
  return fractionSpeech(stripRuby(text, 'kana'))
    .replaceAll('{{INPUT}}', '□')
    .replace(/(\d)\.(?=\d)/g, `$1${t('question.speech.decimal')}`)
    .replace(/km|cm|mm|mL|ml|dL|dl|kg|[mLgℓ]/g, (unit, offset: number, source: string) => {
      if (/[A-Za-z]/.test(source[offset - 1] ?? '') || /[A-Za-z]/.test(source[offset + unit.length] ?? ''))
        return unit;
      return t(`question.speech.${unit === 'ℓ' ? 'L' : unit === 'ml' ? 'mL' : unit === 'dl' ? 'dL' : unit}`);
    })
    .replace(/[+＋\-−－×÷=＝□]/g, (symbol) => t(`question.speech.${symbols[symbol]}`));
}

export function getTextInputSpeech(payload: TextInputPayload, mathematical = true): string {
  const compact = (text: string) => stripRuby(text).replaceAll('{{INPUT}}', '').replace(/\s+/g, '');
  const template = payload.template ?? '{{INPUT}}';
  const repeated = compact(template) === compact(payload.prompt);
  // 図の説明には、数えさせる個数などの答えが含まれるため音声へ足さない。
  const parts = [repeated ? '' : payload.prompt, template];
  if (payload.suffix && !template.trimEnd().endsWith(payload.suffix)) parts.push(payload.suffix);
  const text = parts.filter(Boolean).join('。');
  return mathematical
    ? mathSpeech(text)
    : stripRuby(text, 'kana').replaceAll('{{INPUT}}', t('question.speech.blank'));
}
