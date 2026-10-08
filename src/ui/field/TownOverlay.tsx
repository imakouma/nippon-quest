/**
 * 町の人の しごとの画面（おみせ・かじや・けいじばん）。左に えらぶ リスト、右に くわしい せつめいと ボタン。
 * ロジックは持たない（中身は Overworld が GameState と content から作って渡す）。
 * 操作：↑↓ えらぶ / Z・Enter きめる（かう・つくる・うける）/ X・Esc とじる。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { useModalFocus } from '../useModalFocus';
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const selectedControl = icon === 'role-barber' ? '.nq-barber-choice.nq-focus' : '.nq-town-list .nq-focus';
  useModalFocus(dialogRef, selectedControl);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(selectedControl)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [sel, selectedControl]);

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
      const inControl =
        e.target instanceof HTMLElement &&
        e.target.closest('button, input, select, textarea, [contenteditable="true"]');
      if (inControl && (e.key === 'Enter' || e.key === ' ')) return;
      const L = live.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          if (L.n) L.pick((L.sel - 1 + L.n) % L.n);
          break;
        case 'ArrowDown':
        case 'ArrowRight':
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

  if (icon === 'role-barber') {
    const groups = Object.values(
      rows.reduce<Record<string, TownRow[]>>((all, option) => {
        const part = option.key.split(':')[1] ?? option.key;
        (all[part] ??= []).push(option);
        return all;
      }, {}),
    );
    return (
      <div
        ref={dialogRef}
        class="nq-wmap"
        role="dialog"
        aria-modal="true"
        aria-label={displayText(title)}
        onClick={onClose}
      >
        <div class="nq-win nq-barber" onClick={(e) => e.stopPropagation()}>
          <header class="nq-barber-head">
            <span class="nq-wmap-title">
              <PixelIcon name={icon} scale={3} />
              <RubyLabel text={title} />
            </span>
            <span class="nq-town-gold">{t('field.townGold', { n: gold })}</span>
            <button type="button" class="nq-back" onClick={onClose}>
              × {t('ui.close')}
            </button>
          </header>
          <div class="nq-barber-main">
            <div class="nq-barber-preview">
              {row?.icon && <img src={row.icon} alt={t('newGame.lookPreview')} />}
              {row && <RubyLabel text={row.name} class="nq-barber-name" />}
              {row?.lines.map((line, index) => (
                <RubyLabel key={index} text={line} as="p" />
              ))}
            </div>
            <div class="nq-barber-controls">
              {groups.map((options) => (
                <fieldset key={options[0]!.key.split(':')[1]}>
                  <legend>{options[0]!.name.split('：')[0]}</legend>
                  <div class="nq-barber-options">
                    {options.map((option) => {
                      const index = rows.indexOf(option);
                      return (
                        <button
                          key={option.key}
                          type="button"
                          class={`nq-barber-choice ${index === sel ? 'nq-focus' : ''}`}
                          aria-label={option.name.replace(/\[[^\]]*\]/g, '')}
                          aria-pressed={!!option.tag}
                          aria-current={index === sel ? 'true' : undefined}
                          onPointerEnter={() => pick(index)}
                          onClick={() => (index === sel ? act() : pick(index))}
                        >
                          {option.icon && <img src={option.icon} alt="" />}
                          {option.tag && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>
          <footer class="nq-barber-foot">
            {message && <RubyLabel text={message} class="nq-party-msg" />}
            <RubyLabel class="nq-wmap-keys" text={keys} />
            {row?.action && (
              <button
                type="button"
                class={`nq-opt nq-barber-apply ${row.action.ok ? 'nq-party-evolve-ok' : ''}`}
                disabled={!row.action.ok}
                onClick={act}
              >
                <RubyLabel text={row.action.label} />
              </button>
            )}
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dialogRef}
      class="nq-wmap"
      role="dialog"
      aria-modal="true"
      aria-label={displayText(title)}
      onClick={onClose}
    >
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
                    aria-current={k === sel ? 'true' : undefined}
                    onPointerEnter={() => pick(k)}
                    onClick={() => (k === sel ? act() : pick(k))}
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
