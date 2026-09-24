/**
 * フィールドの会話ウィンドウ（黒い窓＋白い太枠、「＊」、1 文字ずつ、♥ カーソルの はい／いいえ）。
 * 操作：タップ / Z・Enter・Space で次へ（打ち途中なら全部出す）。choices があると最後の行で選ぶ（矢印・X でいいえ）。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from './i18n';
import { createSpeaker } from './overlay';
import { PixelIcon } from './PixelIcon';
import { RubyLabel } from './RubyLabel';
import { stripRuby } from './ruby';
import { playSfx } from './sfx';
import { TypedText, useTypewriter } from './typewriter';

export interface DialogueLine {
  speaker?: string;
  face?: string;
  text: string;
}

export interface DialogueProps {
  lines: DialogueLine[];
  /** 最後の行で出す選択肢（例：はい／いいえ）。onComplete に選んだ番号が返る */
  choices?: string[];
  /** 選択肢なしで読み終えたら -1 */
  onComplete: (choice: number) => void;
}

const speak = createSpeaker();

export function DialogueOverlay({ lines, choices, onComplete }: DialogueProps) {
  const [index, setIndex] = useState(0);
  const [cursor, setCursor] = useState(0);
  const line = lines[Math.min(index, lines.length - 1)];
  const tw = useTypewriter(line ? index : null, line?.text ?? '');
  const last = index >= lines.length - 1;
  const asking = last && !!choices?.length && tw.done;
  const doneRef = useRef(false);

  const finish = (c: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(c);
  };
  const advance = () => {
    if (!tw.done) {
      tw.complete();
      return;
    }
    if (asking) return;
    if (!last) setIndex(index + 1);
    else finish(-1);
  };
  const pick = (i: number) => {
    playSfx('select');
    finish(i);
  };

  const live = useRef({ advance, pick, asking, cursor });
  live.current = { advance, pick, asking, cursor };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = live.current;
      const k = e.key;
      const ok = k === 'Enter' || k === ' ' || k === 'z' || k === 'Z';
      const back = k === 'Escape' || k === 'x' || k === 'X';
      if (r.asking && choices?.length) {
        if (k === 'ArrowUp' || k === 'ArrowLeft') {
          playSfx('move');
          setCursor((c) => Math.max(0, c - 1));
        } else if (k === 'ArrowDown' || k === 'ArrowRight') {
          playSfx('move');
          setCursor((c) => Math.min(choices.length - 1, c + 1));
        } else if (ok) r.pick(r.cursor);
        else if (back) r.pick(choices.length - 1);
        else return;
      } else if (ok || back) r.advance();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choices]);

  if (!line) return null;
  return (
    <div class="nq-dlg" onClick={advance}>
      {asking && choices && (
        <div class="nq-win nq-dlg-choices" role="menu" onClick={(e) => e.stopPropagation()}>
          {choices.map((c, i) => (
            <button
              key={c}
              type="button"
              role="menuitem"
              class={`nq-dlg-choice ${cursor === i ? 'nq-focus' : ''}`}
              onPointerEnter={() => setCursor(i)}
              onClick={() => pick(i)}
            >
              <span class="nq-cur">{cursor === i ? <span class="nq-heart">♥</span> : null}</span>
              {c}
            </button>
          ))}
        </div>
      )}
      <div class="nq-win nq-dlg-box">
        {line.speaker && (
          <div class="nq-win nq-dlg-name">
            <RubyLabel text={line.speaker} />
          </div>
        )}
        <p class="nq-dlg-text">
          {!line.speaker && (
            <span class="nq-dlg-star" aria-hidden="true">
              ＊
            </span>
          )}
          <TypedText text={line.text} n={tw.n} />
        </p>
        <button
          type="button"
          class="nq-dlg-speak"
          aria-label={t('ui.speak')}
          onClick={(e) => {
            e.stopPropagation();
            speak(stripRuby(line.text, 'kana'));
          }}
        >
          <PixelIcon name="speaker" scale={3} />
        </button>
        {tw.done && !asking && (
          <span class="nq-dlg-next" aria-hidden="true">
            ▼
          </span>
        )}
      </div>
    </div>
  );
}
