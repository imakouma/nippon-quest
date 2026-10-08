import type { JSX } from 'preact';
import { displayRuby, openKanjiAboveGrade, parseRuby, type KanjiGradeTable } from './ruby';

export interface RubyLabelProps {
  text: string;
  /** 学年を決めて出すとき（table とセット）。ふだんは いまの漢字表示レベル（setKanjiLevel）で出す */
  grade?: number;
  table?: KanjiGradeTable;
  id?: string;
  class?: string;
  as?: keyof JSX.IntrinsicElements;
}

/** "漢字[かんじ]" → <ruby>漢字<rt>かんじ</rt></ruby>。まだ習っていない漢字の ことばは ひらがなで出す */
export function RubyLabel({ text, grade, table, id, class: cls, as: Tag = 'span' }: RubyLabelProps) {
  const segs = table ? openKanjiAboveGrade(parseRuby(text), grade ?? 6, table) : displayRuby(text);
  const T = Tag as 'span';
  return (
    <T id={id} class={cls}>
      {segs.map((s, i) =>
        s.ruby ? (
          <ruby key={i}>
            {s.base}
            <rt>{s.ruby}</rt>
          </ruby>
        ) : (
          <span key={i}>{s.base}</span>
        ),
      )}
    </T>
  );
}
