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
  const [n, setN] = useState(0);
  const iRef = useRef(0);
  useEffect(() => {
    iRef.current = 0;
    setN(0);
    if (key === null) return;
    const id = setInterval(() => {
      iRef.current += 1;
      setN(iRef.current);
      if (iRef.current % 2 === 0) playSfx('blip');
      if (iRef.current >= total) clearInterval(id);
    }, TYPE_MS);
    return () => clearInterval(id);
  }, [key]);
  const complete = () => {
    iRef.current = total;
    setN(total);
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
