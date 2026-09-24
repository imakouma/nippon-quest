/**
 * RubyText（"漢字[かんじ]"）のパースと、学年に応じた「かな開き」。
 * DOM でも Canvas でも使えるよう、ここは純粋関数だけ（いまの漢字表示レベルだけは setKanjiLevel で持つ）。
 *
 * まだ習っていない漢字（学年別漢字配当表で、漢字表示レベルより上の学年の漢字・表に無い漢字）を ふくむ
 * ルビ付きの ことばは、ルビを振らずに ひらがな（ルビの読み）で出す。ただし地名・名前は 漢字＋ルビのまま。
 * ルビを付けていない漢字（問題で 問う 漢字など）は、いつも そのまま出す。
 */
export interface RubySegment {
  base: string;
  ruby?: string;
}

const RUBY_RE = /([一-鿿々〆ヶ]+)\[([^\]]+)\]/g;

export function parseRuby(text: string): RubySegment[] {
  const out: RubySegment[] = [];
  let last = 0;
  for (const m of text.matchAll(RUBY_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ base: text.slice(last, idx) });
    out.push({ base: m[1]!, ruby: m[2]! });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ base: text.slice(last) });
  return out;
}

/** ルビ記法を落として表示用の素の文字列にする（Canvas 描画・読み上げ用） */
export function stripRuby(text: string, mode: 'kanji' | 'kana' = 'kanji'): string {
  return parseRuby(text)
    .map((s) => (s.ruby && mode === 'kana' ? s.ruby : s.base))
    .join('');
}

/** 漢字 1 文字 → 配当学年（1〜6）。表に無い漢字は 中学校以上で習う */
export type KanjiGradeTable = Record<string, number>;

/** content/i18n/kanji-grades.json の byGrade（{ "1": "一右雨…", … }）から表を作る */
export function kanjiGradeTable(byGrade: Record<string, string>): KanjiGradeTable {
  const table: KanjiGradeTable = {};
  for (const [grade, chars] of Object.entries(byGrade)) for (const ch of chars) table[ch] = Number(grade);
  return table;
}

/** 行政区画の名前（〇〇市・〇〇町 など）：漢字 2 字以上 ＋ 県・府・市・区・町・村・郡 */
const PLACE_RE = /^[一-鿿々〆ヶ]{2,}[県府市区町村郡]$/;
/** PLACE_RE に当てはまるが、地名ではない ことば */
const NOT_PLACE = new Set(['都道府県', '市町村', '城下町', '門前町', '宿場町', '大都市', '特別区']);
/** くり返しの記号など、それだけでは学年を持たない字（前の漢字と同じあつかい） */
const MARKS = new Set(['々', '〆', 'ヶ']);
const NO_NAMES: ReadonlySet<string> = new Set();

/** 地名・名前か（まだ習っていない漢字でも 漢字＋ルビのまま出す） */
export function isProperName(base: string, names: ReadonlySet<string>): boolean {
  return names.has(base) || (PLACE_RE.test(base) && !NOT_PLACE.has(base));
}

/**
 * 設定学年より上の漢字（表に無い漢字も）を ふくむ ルビ付きの ことばは、ひらがな（ルビの読み）に開く。
 * 地名・名前（names と 〇〇市 など）と、ルビの無い漢字は そのまま。表が無ければ何もしない。
 */
export function openKanjiAboveGrade(
  segments: RubySegment[],
  grade: number,
  table?: KanjiGradeTable,
  names: ReadonlySet<string> = NO_NAMES,
): RubySegment[] {
  if (!table) return segments;
  return segments.map((s) => {
    if (!s.ruby || isProperName(s.base, names)) return s;
    const tooHard = [...s.base].some((ch) => !MARKS.has(ch) && (table[ch] ?? 99) > grade);
    return tooHard ? { base: s.ruby } : s;
  });
}

/** いまの漢字表示レベル（GameState の learning.kanjiLevel。Boot が入れる） */
export interface KanjiLevel {
  grade: number;
  table: KanjiGradeTable;
  /** content/i18n/proper-nouns.json の地名・名前 */
  names: ReadonlySet<string>;
}

let level: KanjiLevel | null = null;

export function setKanjiLevel(next: KanjiLevel | null): void {
  level = next;
}

/** 画面に出すときの形：いまの漢字表示レベルで、まだ習っていない漢字の ことばを ひらがなに開く */
export function displayRuby(text: string): RubySegment[] {
  const segs = parseRuby(text);
  return level ? openKanjiAboveGrade(segs, level.grade, level.table, level.names) : segs;
}

/** displayRuby からルビを落とした文字（1 文字ずつ出すときの長さ・aria-label など） */
export function displayText(text: string): string {
  return displayRuby(text)
    .map((s) => s.base)
    .join('');
}
