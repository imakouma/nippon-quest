/**
 * 1 文字ずつ出る文字（会話・バトルのメッセージで共通）。ルビは漢字が全部出てから付ける。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { displayRuby, displayText } from './ruby';
import { playSfx } from './sfx';

/** 1 文字あたりの表示間隔 */
export const TYPE_MS = 32;

/** key が変わるたびに最初から打ち直す。key が null なら何もしない */
export function useTypewriter(key: string | number | null, text: string) {
  // まだ習っていない漢字は ひらがなに開いて出すので、長さも開いたあとの文字で数える
  const total = key === null ? 0 : displayText(text).length;
  // 打鍵数は「どの key の文か」と一緒に持つ。key が変わった直後の描画では
  // 前の文の打鍵数を新しい文へ持ち越さない（effect のリセット前に全文が
  // 一瞬見えてしまうのを防ぐ）。
  const [progress, setProgress] = useState<{ key: string | number | null; n: number }>({ key, n: 0 });
  const iRef = useRef(0);
  const n = progress.key === key ? progress.n : 0;
  useEffect(() => {
    iRef.current = 0;
    setProgress({ key, n: 0 });
    if (key === null) return;
    const id = setInterval(() => {
      iRef.current += 1;
      setProgress({ key, n: iRef.current });
      if (iRef.current % 2 === 0) playSfx('blip');
      if (iRef.current >= total) clearInterval(id);
    }, TYPE_MS);
    return () => clearInterval(id);
  }, [key]);
  const complete = () => {
    iRef.current = total;
    setProgress({ key, n: total });
  };
  return { n, done: n >= total, complete };
}

/** 途中まで打たれた RubyText */
export function TypedText({ text, n }: { text: string; n: number }) {
  let left = n;
  return (
    <>
      {displayRuby(text).map((s, i) => {
        if (left <= 0) return null;
        const vis = Math.min(s.base.length, left);
        left -= vis;
        if (s.ruby && vis === s.base.length)
          return (
            <ruby key={i}>
              {s.base}
              <rt>{s.ruby}</rt>
            </ruby>
          );
        return <span key={i}>{s.base.slice(0, vis)}</span>;
      })}
    </>
  );
}
