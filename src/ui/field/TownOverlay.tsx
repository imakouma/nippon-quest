/**
 * 町の人の しごとの画面（おみせ・かじや・けいじばん）。左に えらぶ リスト、右に くわしい せつめいと ボタン。
 * ロジックは持たない（中身は Overworld が GameState と content から作って渡す）。
 * 操作：↑↓ えらぶ / Z・Enter きめる（かう・つくる・うける）/ X・Esc とじる。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';
import './field.css';

export interface TownRow {
  key: string;
  /** 名前（RubyText） */
  name: string;
  /** どうぐの アイコン（data URL） */
  icon?: string;
  /** リストの 右はしの ひとこと（ねだん） */
  right?: string;
  /** 右の せつめいの 名前の下の ひとこと（無ければ right） */
  sub?: string;
  /** 名前の あとの 札（「たっせい！」など） */
  tag?: string;
  /** かえない・つくれない（うすく出す） */
  dim?: boolean;
  /** 右の せつめいに ならべる 行（RubyText） */
  lines: string[];
  blurb?: string;
  /** ボタン。null なら ボタンを出さない（おわった たのみごと など） */
  action: { label: string; ok: boolean } | null;
}

export interface TownOverlayProps {
  title: string;
  /** タイトルの アイコン（PixelIcon の名前：role-shop など） */
  icon: string;
  gold: number;
  rows: TownRow[];
  /** リストが空のときの ひとこと */
  empty: string;
  message: string | null;
  focusKey?: string;
  keys: string;
  onAct: (key: string) => void;
  onClose: () => void;
}

export function TownOverlay({
  title,
  icon,
  gold,
  rows,
  empty,
  message,
  focusKey,
  keys,
  onAct,
  onClose,
}: TownOverlayProps) {
  const [sel, setSel] = useState(() =>
    Math.max(
      0,
      rows.findIndex((r) => r.key === focusKey),
    ),
  );
  const row = rows[sel];

  const pick = (k: number) => {
    if (k === sel || !rows[k]) return;
    playSfx('move');
    setSel(k);
  };
  const act = () => {
    if (!row?.action?.ok) {
      playSfx('miss');
      return;
    }
    onAct(row.key);
  };

  const live = useRef({ pick, act, onClose, sel, n: rows.length });
  live.current = { pick, act, onClose, sel, n: rows.length };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const L = live.current;
      switch (e.key) {
        case 'ArrowUp':
          if (L.n) L.pick((L.sel - 1 + L.n) % L.n);
          break;
        case 'ArrowDown':
          if (L.n) L.pick((L.sel + 1) % L.n);
          break;
        case 'Enter':
        case ' ':
        case 'z':
        case 'Z':
          L.act();
          break;
        case 'Escape':
        case 'x':
        case 'X':
          L.onClose();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div class="nq-wmap" onClick={onClose}>
      <div class="nq-win nq-wmap-box" onClick={(e) => e.stopPropagation()}>
        <div class="nq-wmap-left">
          <div class="nq-wmap-region">
            <span class="nq-wmap-title">
              <PixelIcon name={icon} scale={3} />
              <RubyLabel text={title} />
            </span>
            <span class="nq-town-gold">{t('field.townGold', { n: gold })}</span>
          </div>
          {rows.length ? (
            <ul class="nq-party-list nq-town-list">
              {rows.map((x, k) => (
                <li key={x.key}>
                  <button
                    type="button"
                    class={`nq-opt ${k === sel ? 'nq-focus' : ''} ${x.dim ? 'nq-town-dim' : ''}`}
                    onPointerEnter={() => pick(k)}
                    onClick={() => pick(k)}
                  >
                    <span class="nq-amap-cur">{k === sel && <span class="nq-heart">♥</span>}</span>
                    {x.icon && <img class="nq-item-icon nq-town-icon" src={x.icon} alt="" />}
                    <RubyLabel text={x.name} class="nq-opt-name" />
                    {x.tag && <span class="nq-party-tag nq-party-tag-evo">{x.tag}</span>}
                    {x.right && <span class="nq-town-right">{x.right}</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <RubyLabel text={empty} class="nq-town-empty" as="p" />
          )}
        </div>

        <div class="nq-wmap-right">
          <div class="nq-wmap-head">
            {message ? <RubyLabel text={message} class="nq-party-msg" /> : <span />}
            <button type="button" class="nq-back" onClick={onClose}>
              × {t('ui.close')}
            </button>
          </div>
          {row && (
            <div class="nq-wmap-info nq-party-info">
              <div class="nq-party-head">
                {row.icon && (
                  <div class="nq-party-art nq-town-art">
                    <img src={row.icon} alt="" />
                  </div>
                )}
                <div class="nq-party-who">
                  <RubyLabel text={row.name} class="nq-party-name" />
                  {(row.sub ?? row.right) && <span class="nq-party-sub">{row.sub ?? row.right}</span>}
                </div>
              </div>
              <ul class="nq-town-lines">
                {row.lines.map((l, i) => (
                  <li key={i}>
                    <RubyLabel text={l} />
                  </li>
                ))}
              </ul>
              {row.blurb && <RubyLabel text={row.blurb} class="nq-party-blurb" as="p" />}
            </div>
          )}
          {row?.action && (
            <div class="nq-wmap-foot nq-party-foot">
              <button
                type="button"
                class={`nq-opt nq-wmap-go ${row.action.ok ? 'nq-party-evolve-ok' : ''}`}
                disabled={!row.action.ok}
                onClick={act}
              >
                <PixelIcon name={icon} scale={3} />
                <RubyLabel text={row.action.label} />
              </button>
            </div>
          )}
          <RubyLabel class="nq-wmap-keys" text={keys} />
        </div>
      </div>
    </div>
  );
}
