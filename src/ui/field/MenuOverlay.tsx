/**
 * メニュー：モンスターずかん・とくさんひんずかん・どうぐ（バッグ）・そうび・みため を タブで きりかえて見る。
 * ロジックは持たない（中身は Overworld が GameState と content から作って渡す）。
 * 操作：←→ タブ / ↑↓ えらぶ / Z・Enter つかう・そうびする・はずす / X・Esc とじる。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';
import './field.css';
import './menu.css';

export type MenuTab = 'monsters' | 'specialties' | 'bag' | 'equip' | 'look';

export interface MenuEntry {
  key: string;
  /** 名前（RubyText）。まだ見ていないものは ？？？ */
  name: string;
  /** リストの 小さな絵（data URL） */
  icon?: string;
  /** 右の せつめいの 大きな絵（data URL）。無ければ icon */
  art?: string;
  /** false＝まだ であっていない・見つけていない（絵を かげに、名前を ？？？ に） */
  known: boolean;
  /** リストの 右はし（こすう・No.） */
  right?: string;
  /** 名前の あとの 札（なかま・そうびちゅう） */
  tag?: string;
  /** 右の せつめいの 名前の下（RubyText） */
  sub?: string;
  lines: string[];
  blurb?: string;
  action?: { label: string; ok: boolean } | null;
}

export interface MenuOverlayProps {
  tab: MenuTab;
  /** group があると、その なかまの さいしょの タブの 前に 小さな 見出し（「ずかん」）を出す */
  tabs: { key: MenuTab; label: string; icon: string; count?: string; group?: string }[];
  entries: MenuEntry[];
  /** リストの上に出す 行（そうびの タブの ステータス など） */
  summary?: string;
  empty: string;
  message: string | null;
  focusKey?: string;
  keys: string;
  onTab: (tab: MenuTab) => void;
  onAct: (key: string) => void;
  onClose: () => void;
}

export function MenuOverlay({
  tab,
  tabs,
  entries,
  summary,
  empty,
  message,
  focusKey,
  keys,
  onTab,
  onAct,
  onClose,
}: MenuOverlayProps) {
  const find = () =>
    Math.max(
      0,
      entries.findIndex((e) => e.key === focusKey),
    );
  const [sel, setSel] = useState(find);
  // タブが かわったら いちばん上（か focusKey）から
  const lastTab = useRef(tab);
  if (lastTab.current !== tab) {
    lastTab.current = tab;
    const k = find();
    if (k !== sel) setSel(k);
  }
  const e = entries[Math.min(sel, entries.length - 1)];
  const listRef = useRef<HTMLUListElement>(null);

  const pick = (k: number) => {
    if (k === sel || !entries[k]) return;
    playSfx('move');
    setSel(k);
    listRef.current?.children[k]?.scrollIntoView({ block: 'nearest' });
  };
  const act = () => {
    if (!e?.action?.ok) {
      playSfx('miss');
      return;
    }
    onAct(e.key);
  };
  const tabIdx = tabs.findIndex((x) => x.key === tab);
  const moveTab = (d: number) => {
    const next = tabs[(tabIdx + d + tabs.length) % tabs.length];
    if (!next) return;
    playSfx('move');
    onTab(next.key);
  };

  const live = useRef({ pick, act, moveTab, onClose, sel, n: entries.length });
  live.current = { pick, act, moveTab, onClose, sel, n: entries.length };
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const L = live.current;
      switch (ev.key) {
        case 'ArrowUp':
          if (L.n) L.pick((L.sel - 1 + L.n) % L.n);
          break;
        case 'ArrowDown':
          if (L.n) L.pick((L.sel + 1) % L.n);
          break;
        case 'ArrowLeft':
          L.moveTab(-1);
          break;
        case 'ArrowRight':
          L.moveTab(1);
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
        case 'i':
        case 'I':
          L.onClose();
          break;
        default:
          return;
      }
      ev.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pic = e?.art ?? e?.icon;
  return (
    <div class="nq-wmap" onClick={onClose}>
      <div class="nq-win nq-wmap-box nq-menu-box" onClick={(ev) => ev.stopPropagation()}>
        <div class="nq-menu-tabs" role="tablist">
          {tabs.map((x, i) => [
            x.group && x.group !== tabs[i - 1]?.group && (
              <span key={`g-${x.key}`} class="nq-menu-group">
                {x.group}
              </span>
            ),
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={x.key === tab}
              class={`nq-opt nq-menu-tab ${x.key === tab ? 'nq-focus' : ''}`}
              onClick={() => x.key !== tab && (playSfx('move'), onTab(x.key))}
            >
              <PixelIcon name={x.icon} scale={2} />
              <RubyLabel text={x.label} />
              {x.count && <span class="nq-menu-count">{x.count}</span>}
            </button>,
          ])}
          <button type="button" class="nq-back nq-menu-close" onClick={onClose}>
            × {t('ui.close')}
          </button>
        </div>
        <div class="nq-menu-body">
          <div class="nq-wmap-left">
            {summary && <RubyLabel text={summary} class="nq-menu-summary" as="p" />}
            {entries.length ? (
              <ul class="nq-party-list nq-town-list" ref={listRef}>
                {entries.map((x, k) => (
                  <li key={x.key}>
                    <button
                      type="button"
                      class={`nq-opt ${k === sel ? 'nq-focus' : ''} ${x.known ? '' : 'nq-menu-unknown'}`}
                      onPointerEnter={() => pick(k)}
                      onClick={() => pick(k)}
                    >
                      <span class="nq-amap-cur">{k === sel && <span class="nq-heart">♥</span>}</span>
                      {x.icon && <img class="nq-item-icon nq-town-icon nq-menu-icon" src={x.icon} alt="" />}
                      <RubyLabel text={x.name} class="nq-opt-name" />
                      {x.tag && <span class="nq-party-tag">{x.tag}</span>}
                      {x.right && <RubyLabel text={x.right} class="nq-town-right" />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <RubyLabel text={empty} class="nq-town-empty" as="p" />
            )}
          </div>

          <div class="nq-wmap-right">
            {message && <RubyLabel text={message} class="nq-party-msg" as="p" />}
            {e && (
              <div class="nq-wmap-info nq-party-info">
                <div class="nq-party-head">
                  <div class={`nq-party-art ${e.known ? '' : 'nq-menu-unknown-art'}`}>
                    {pic ? <img src={pic} alt="" /> : <PixelIcon name="star-off" scale={6} />}
                  </div>
                  <div class="nq-party-who">
                    <RubyLabel text={e.name} class="nq-party-name" />
                    {e.sub && <RubyLabel text={e.sub} class="nq-party-sub" />}
                  </div>
                </div>
                <ul class="nq-town-lines">
                  {e.lines.map((l, i) => (
                    <li key={i}>
                      <RubyLabel text={l} />
                    </li>
                  ))}
                </ul>
                {e.blurb && <RubyLabel text={e.blurb} class="nq-party-blurb" as="p" />}
              </div>
            )}
            {e?.action && (
              <div class="nq-wmap-foot nq-party-foot">
                <button
                  type="button"
                  class={`nq-opt nq-wmap-go ${e.action.ok ? 'nq-party-evolve-ok' : ''}`}
                  disabled={!e.action.ok}
                  onClick={act}
                >
                  <RubyLabel text={e.action.label} />
                </button>
              </div>
            )}
            <RubyLabel class="nq-wmap-keys" text={keys} />
          </div>
        </div>
      </div>
    </div>
  );
}
