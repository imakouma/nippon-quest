/**
 * タイトル画面のメニュー（黒い窓＋白い太枠、♥ カーソル）。
 * 操作：↑↓ で選ぶ / Z・Enter・Space で決定。えらべない項目は理由を下に出す。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import './title.css';

export interface TitleMenuItem {
  label: string;
  disabled?: boolean;
}

export interface TitleMenuProps {
  items: TitleMenuItem[];
  hint: string;
  /** えらべない項目を選んだときに出す一言 */
  disabledNote: string;
  credit: string;
  onSelect: (index: number) => void;
}

export function TitleMenu({ items, hint, disabledNote, credit, onSelect }: TitleMenuProps) {
  const [cursor, setCursor] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const hasDisabledItem = items.some((item) => item.disabled);

  const choose = (i: number) => {
    if (chosen !== null) return;
    const it = items[i];
    if (!it) return;
    if (it.disabled) {
      playSfx('miss');
      setNote(disabledNote);
      return;
    }
    playSfx('select');
    setChosen(i);
    onSelect(i);
  };

  // セーブ確認の完了後に「つづきから」が無効へ切り替わっても、カーソルを
  // 無効な項目に残さない。キーボード操作でも選択できない状態を保つ。
  useEffect(() => {
    if (!items[cursor]?.disabled) return;
    const firstEnabled = items.findIndex((item) => !item.disabled);
    if (firstEnabled >= 0) setCursor(firstEnabled);
  }, [cursor, items]);

  const live = useRef({ cursor, choose });
  live.current = { cursor, choose };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === 'ArrowUp' || k === 'ArrowDown') {
        const direction = k === 'ArrowUp' ? -1 : 1;
        let next = live.current.cursor + direction;
        while (next >= 0 && next < items.length && items[next]?.disabled) next += direction;
        if (next < 0 || next >= items.length) next = live.current.cursor;
        if (next !== live.current.cursor) {
          playSfx('move');
          setCursor(next);
        }
      } else if (k === 'Enter' || k === ' ' || k === 'z' || k === 'Z')
        live.current.choose(live.current.cursor);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length]);

  useEffect(() => {
    const focusCursor = () => buttons.current[cursor]?.focus({ preventScroll: true });
    focusCursor();
    // 初回ロードではフォント確定時に canvas の初期化と競合することがあるため、
    // レイアウト確定後にも現在項目へ戻す。
    let active = true;
    void document.fonts.ready.then(() => active && focusCursor());
    const timer = window.setTimeout(focusCursor, 1000);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [cursor]);

  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(null), 2200);
    return () => clearTimeout(id);
  }, [note]);

  return (
    <div class="nq-title">
      <div class="nq-win nq-title-menu" role="menu" aria-label="メインメニュー">
        {items.map((it, i) => (
          <button
            key={it.label}
            ref={(button) => {
              buttons.current[i] = button;
            }}
            type="button"
            role="menuitem"
            disabled={it.disabled}
            aria-disabled={it.disabled}
            aria-describedby={it.disabled ? 'nq-title-disabled-note' : undefined}
            class={`nq-title-opt ${cursor === i ? 'nq-focus' : ''} ${it.disabled ? 'nq-off' : ''} ${chosen === i ? 'nq-chosen' : ''}`}
            onPointerEnter={() => !it.disabled && cursor !== i && setCursor(i)}
            onClick={() => {
              if (it.disabled) return;
              setCursor(i);
              choose(i);
            }}
          >
            <span class="nq-cur">{cursor === i ? <span class="nq-heart">♥</span> : null}</span>
            <RubyLabel text={it.label} />
          </button>
        ))}
        {hasDisabledItem ? (
          <p id="nq-title-disabled-note" class="nq-title-disabled-note">
            <RubyLabel text={disabledNote} />
          </p>
        ) : null}
      </div>
      <p class={`nq-title-hint ${note ? 'nq-title-note' : ''}`} aria-live="polite">
        <RubyLabel text={note ?? hint} />
      </p>
      <p class="nq-title-credit" aria-label={displayText(credit)}>
        <RubyLabel text={credit} />
      </p>
    </div>
  );
}
