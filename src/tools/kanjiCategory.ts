import type { QuestionBase } from '../questions/contracts';
import { stripRuby } from '../ui/ruby';

export type KanjiCategory = 'reading' | 'writing' | 'review';
export type KanjiReadingKind = 'on' | 'kun';
export type KanjiOtherKind = 'idiom' | 'relation' | 'misc';
export type KanjiScopeKind = KanjiReadingKind | KanjiOtherKind | 'writing';

export const FIRST_GRADE_READING_UNITS = ['kokugo.g1.kanji', 'kokugo.g1.legacy-jpn-1-2'] as const;

const promptText = (question: QuestionBase): string => {
  const payload =
    question.payload && typeof question.payload === 'object'
      ? (question.payload as Record<string, unknown>)
      : {};
  return typeof payload.prompt === 'string' ? stripRuby(payload.prompt, 'kanji').replace(/\s/g, '') : '';
};

export function kanjiReadingKind(question: QuestionBase | null): KanjiReadingKind | null {
  if (!question) return null;
  if (question.tags?.includes('kanji:reading:on')) return 'on';
  if (question.tags?.includes('kanji:reading:kun')) return 'kun';
  const prompt = promptText(question);
  if (/音読み|おんよみ/.test(prompt)) return 'on';
  if (/訓読み|くんよみ/.test(prompt)) return 'kun';
  return null;
}

export function kanjiOtherKind(question: QuestionBase | null): KanjiOtherKind {
  if (!question) return 'misc';
  if (question.tags?.includes('kanji:other:idiom')) return 'idiom';
  if (question.tags?.includes('kanji:other:relation')) return 'relation';
  const prompt = promptText(question);
  if (
    /四字熟語|よじじゅくご|「\p{Script=Han}{4}(?:（|」)/u.test(prompt) ||
    /yoji-jukugo|four-character-idiom/.test(question.unit)
  )
    return 'idiom';
  if (/対義語|類義語|反対語|反対の(?:意味|言葉)|はんたいのことば|同じ意味|似た意味|にたいみ/.test(prompt))
    return 'relation';
  return 'misc';
}

export const kanjiScope = (grade: number, kind: KanjiScopeKind): string => `kanji-scope:${grade}:${kind}`;

export function kanjiScopeMatches(question: QuestionBase, scope: string): boolean {
  const match = /^kanji-scope:([1-6]):(on|kun|writing|idiom|relation|misc)$/.exec(scope);
  if (!match || question.grade !== Number(match[1])) return false;
  const kind = match[2] as KanjiScopeKind;
  if (kind === 'writing') return kanjiCategory(question) === 'writing';
  if (kind === 'on' || kind === 'kun') return kanjiReadingKind(question) === kind;
  return kanjiCategory(question) === 'review' && kanjiOtherKind(question) === kind;
}

/** `writing` is reserved for questions where the learner actually writes a kanji. */
export function kanjiCategory(question: QuestionBase | null): KanjiCategory {
  if (!question) return 'review';
  const payload =
    question.payload && typeof question.payload === 'object'
      ? (question.payload as Record<string, unknown>)
      : {};
  if (question.type === 'kanji-trace' && payload.mode !== 'reading') return 'writing';
  if (kanjiReadingKind(question)) return 'reading';
  return 'review';
}
