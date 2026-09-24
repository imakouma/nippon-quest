/**
 * タイトル画面のメニュー（黒い窓＋白い太枠、♥ カーソル）。
 * 操作：↑↓ で選ぶ / Z・Enter・Space で決定。えらべない項目は理由を下に出す。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
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

  const live = useRef({ cursor, choose });
  live.current = { cursor, choose };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === 'ArrowUp' || k === 'ArrowDown') {
        const next = Math.max(
          0,
          Math.min(items.length - 1, live.current.cursor + (k === 'ArrowUp' ? -1 : 1)),
        );
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
    if (!note) return;
    const id = setTimeout(() => setNote(null), 2200);
    return () => clearTimeout(id);
  }, [note]);

  return (
    <div class="nq-title">
      <div class="nq-win nq-title-menu" role="menu">
        {items.map((it, i) => (
          <button
            key={it.label}
            type="button"
            role="menuitem"
            aria-disabled={it.disabled}
            class={`nq-title-opt ${cursor === i ? 'nq-focus' : ''} ${it.disabled ? 'nq-off' : ''} ${chosen === i ? 'nq-chosen' : ''}`}
            onPointerEnter={() => cursor !== i && setCursor(i)}
            onClick={() => {
              setCursor(i);
              choose(i);
            }}
          >
            <span class="nq-cur">{cursor === i ? <span class="nq-heart">♥</span> : null}</span>
            {it.label}
          </button>
        ))}
      </div>
      <p class={`nq-title-hint ${note ? 'nq-title-note' : ''}`}>{note ?? hint}</p>
      <p class="nq-title-credit">{credit}</p>
    </div>
  );
}
