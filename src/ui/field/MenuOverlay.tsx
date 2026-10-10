/**
 * メニュー：大きなカテゴリーボタンから、学習・図鑑・道具などの画面へ進む。
 * ロジックは持たない（中身は Overworld が GameState と content から作って渡す）。
 * 操作：矢印で選択 / Z・Enter 決定 / X・Esc ひとつ戻る。
 */
import { Component } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { MenuEntry, MenuHomeKey, MenuTab, RoadmapNode } from '../../shared/menuModel';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { useModalFocus } from '../useModalFocus';
import { MenuCategoryIcon } from './MenuCategoryIcon';
import { RoadmapView } from './RoadmapView';
import './field.css';
import './menu.css';

export type { MenuEntry, MenuTab, RoadmapNode } from '../../shared/menuModel';

export interface MenuOverlayProps {
  tab: MenuTab;
  /** group があると、その なかまの さいしょの タブの 前に 小さな 見出し（「ずかん」）を出す */
  tabs: { key: MenuHomeKey; label: string; icon: string; count?: string; group?: string }[];
  entries: MenuEntry[];
  roadmap?: RoadmapNode[];
  /** リストの上に出す 行（そうびの タブの ステータス など） */
  summary?: string;
  empty: string;
  message: string | null;
  focusKey?: string;
  initialHome?: boolean;
  keys: string;
  onTab: (tab: MenuTab) => void;
  onBag: () => void;
  onAct: (key: string) => void;
  onRoadmapSelect: (unitId: string) => void;
  onSave: () => void;
  onParent: () => void;
  onClose: () => void;
}

type MenuPick = (index: number, ensureVisible?: boolean) => void;

/** 大きな図鑑で、選択前後の行以外を再描画しない。 */
interface MenuListRowProps {
  entry: MenuEntry;
  index: number;
  selected: boolean;
  onPick: MenuPick;
}

class MenuListRow extends Component<MenuListRowProps> {
  override shouldComponentUpdate(next: MenuListRowProps) {
    return (
      next.entry !== this.props.entry ||
      next.selected !== this.props.selected ||
      next.onPick !== this.props.onPick
    );
  }

  override render({ entry, index, selected, onPick }: MenuListRowProps) {
    return (
      <li>
        <button
          type="button"
          data-menu-entry
          class={`nq-opt ${selected ? 'nq-focus' : ''} ${entry.known ? '' : 'nq-menu-unknown'}`}
          aria-current={selected ? 'true' : undefined}
          onPointerEnter={() => onPick(index)}
          onClick={() => onPick(index)}
        >
          <span class="nq-amap-cur">{selected && <span class="nq-heart">♥</span>}</span>
          {entry.icon && <img class="nq-item-icon nq-town-icon nq-menu-icon" src={entry.icon} alt="" />}
          <RubyLabel text={entry.name} class="nq-opt-name" />
          {entry.tag && <span class="nq-party-tag">{entry.tag}</span>}
          {entry.right && <RubyLabel text={entry.right} class="nq-town-right" />}
        </button>
      </li>
    );
  }
}

export function MenuOverlay({
  tab,
  tabs,
  entries,
  roadmap = [],
  summary,
  empty,
  message,
  focusKey,
  initialHome = true,
  keys,
  onTab,
  onBag,
  onAct,
  onRoadmapSelect,
  onSave,
  onParent,
  onClose,
}: MenuOverlayProps) {
  const find = () =>
    Math.max(
      0,
      entries.findIndex((e) => e.key === focusKey),
    );
  const [sel, setSel] = useState(find);
  const [home, setHome] = useState(initialHome);
  const [saved, setSaved] = useState(false);
  const [dexGroup, setDexGroup] = useState<string | null>(null);
  const [homeSel, setHomeSel] = useState(() =>
    Math.max(
      0,
      tabs.findIndex((x) => x.key === tab),
    ),
  );
  // タブが かわったら いちばん上（か focusKey）から
  const lastTab = useRef(tab);
  if (lastTab.current !== tab) {
    lastTab.current = tab;
    const k = find();
    if (k !== sel) setSel(k);
  }
  const isDex = tab === 'monsters' || tab === 'specialties';
  const groups = isDex
    ? [
        ...new Map(
          entries.filter((entry) => entry.group).map((entry) => [entry.group!, entry.groupLabel!]),
        ).entries(),
      ]
    : [];
  const activeGroup = groups.some(([id]) => id === dexGroup) ? dexGroup : (groups[0]?.[0] ?? null);
  const visibleEntries = activeGroup ? entries.filter((entry) => entry.group === activeGroup) : entries;
  const visibleIndexes = visibleEntries.map((entry) => entries.indexOf(entry));
  const visibleSel = Math.max(0, visibleIndexes.indexOf(sel));
  const e = entries[Math.min(sel, entries.length - 1)];
  const listRef = useRef<HTMLUListElement>(null);
  const homeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(dialogRef, '.nq-menu-card');

  useEffect(() => {
    if (home) homeButtonRef.current?.focus();
  }, [home]);

  // 一覧を矢印で動かした時も、見た目の選択と実際のフォーカスを一致させる。
  useEffect(() => {
    if (home || tab === 'roadmap') return;
    dialogRef.current?.querySelector<HTMLButtonElement>('[data-menu-entry].nq-focus')?.focus();
  }, [activeGroup, home, sel, tab]);

  const pick = useCallback<MenuPick>(
    (k, ensureVisible = false) => {
      if (!entries[k]) return;
      setSel((current) => {
        if (k === current) return current;
        playSfx('move');
        if (ensureVisible)
          requestAnimationFrame(() =>
            listRef.current
              ?.querySelector<HTMLButtonElement>('[data-menu-entry].nq-focus')
              ?.scrollIntoView({ block: 'nearest' }),
          );
        return k;
      });
    },
    [entries],
  );
  const act = () => {
    if (!e?.action?.ok) {
      playSfx('miss');
      return;
    }
    onAct(e.key);
  };
  const tabIdx = tabs.findIndex((x) => x.key === (tab === 'specialties' ? 'monsters' : tab));
  const openTab = (index: number) => {
    const next = tabs[index];
    if (!next) return;
    playSfx('select');
    setHomeSel(index);
    if (next.key === 'party') {
      onBag();
      return;
    }
    setHome(false);
    if (next.key !== tab) onTab(next.key);
  };
  const backToHome = () => {
    playSfx('back');
    setHome(true);
  };
  const selectDexGroup = (group: string) => {
    const index = entries.findIndex((entry) => entry.group === group);
    if (index < 0) return;
    playSfx('move');
    setDexGroup(group);
    setSel(index);
  };

  const live = useRef({
    pick,
    act,
    openTab,
    backToHome,
    onClose,
    sel,
    n: entries.length,
    home,
    homeSel,
    isDex,
    visibleIndexes,
    visibleSel,
  });
  live.current = {
    pick,
    act,
    openTab,
    backToHome,
    onClose,
    sel,
    n: entries.length,
    home,
    homeSel,
    isDex,
    visibleIndexes,
    visibleSel,
  };
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (
        (ev.key === 'Enter' || ev.key === ' ') &&
        ev.target instanceof HTMLElement &&
        ev.target.closest('button, input, select, textarea, [contenteditable="true"]')
      )
        return;
      const L = live.current;
      if (L.home) {
        // ホームは4枚を1行に並べる。列数を表示レイアウトと合わせることで、
        // 上下キーが同じ列のカードを選び続けるようにする。
        const columns = 4;
        const moveHome = (delta: number) => {
          const next = (live.current.homeSel + delta + tabs.length) % tabs.length;
          live.current.homeSel = next;
          setHomeSel(next);
          dialogRef.current?.querySelectorAll<HTMLButtonElement>('.nq-menu-card')[next]?.focus();
        };
        switch (ev.key) {
          case 'ArrowLeft':
            moveHome(-1);
            playSfx('move');
            break;
          case 'ArrowRight':
            moveHome(1);
            playSfx('move');
            break;
          case 'ArrowUp':
            moveHome(-columns);
            playSfx('move');
            break;
          case 'ArrowDown':
            moveHome(columns);
            playSfx('move');
            break;
          case 'Enter':
          case ' ':
          case 'z':
          case 'Z':
            L.openTab(L.homeSel);
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
        return;
      }
      switch (ev.key) {
        case 'ArrowUp':
          if (L.isDex && L.visibleIndexes.length)
            L.pick(
              L.visibleIndexes[(L.visibleSel - 3 + L.visibleIndexes.length) % L.visibleIndexes.length]!,
              true,
            );
          else if (L.n) L.pick((L.sel - 1 + L.n) % L.n, true);
          break;
        case 'ArrowDown':
          if (L.isDex && L.visibleIndexes.length)
            L.pick(L.visibleIndexes[(L.visibleSel + 3) % L.visibleIndexes.length]!, true);
          else if (L.n) L.pick((L.sel + 1) % L.n, true);
          break;
        case 'ArrowLeft':
          if (L.isDex && L.visibleIndexes.length)
            L.pick(
              L.visibleIndexes[(L.visibleSel - 1 + L.visibleIndexes.length) % L.visibleIndexes.length]!,
              true,
            );
          break;
        case 'ArrowRight':
          if (L.isDex && L.visibleIndexes.length)
            L.pick(L.visibleIndexes[(L.visibleSel + 1) % L.visibleIndexes.length]!, true);
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
          L.backToHome();
          break;
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
      <div
        ref={dialogRef}
        class="nq-win nq-wmap-box nq-menu-box"
        role="dialog"
        aria-modal="true"
        aria-label={t('field.menu')}
        tabindex={-1}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div class="nq-menu-head">
          <span class="nq-menu-title">
            <PixelIcon name="cmd-item" scale={2} />
            {t('field.menu')}
          </span>
          {home && <span class="nq-menu-key-hint">{t('field.menuKeys')}</span>}
          {!home && (
            <span class="nq-menu-section-title">
              <PixelIcon name={tabs[tabIdx]?.icon ?? 'star'} scale={1} />
              <RubyLabel text={tabs[tabIdx]?.label ?? ''} />
            </span>
          )}
          {!home && (
            <button type="button" class="nq-back nq-menu-back" onClick={backToHome}>
              ← {t('ui.back')}
            </button>
          )}
          <button type="button" class="nq-back nq-menu-close" onClick={onClose}>
            × {t('ui.close')}
          </button>
        </div>
        {home ? (
          <>
            <div class="nq-menu-home" role="group" aria-label={t('field.menu')}>
              {tabs.map((x, index) => (
                <button
                  key={x.key}
                  ref={index === homeSel ? homeButtonRef : undefined}
                  type="button"
                  class={`nq-menu-card nq-menu-card-${x.key} ${index === homeSel ? 'nq-focus' : ''}`}
                  onPointerEnter={() => setHomeSel(index)}
                  onFocus={() => setHomeSel(index)}
                  onClick={() => openTab(index)}
                >
                  <span class="nq-menu-card-icon">
                    <MenuCategoryIcon name={x.key} />
                  </span>
                  <RubyLabel text={x.label} class="nq-menu-card-label" />
                  {x.count && Number(x.count) > 0 && <span class="nq-menu-card-count">{x.count}</span>}
                </button>
              ))}
            </div>
            <div class="nq-menu-footer">
              <button
                type="button"
                class="nq-opt nq-menu-save"
                onClick={() => {
                  onSave();
                  setSaved(true);
                }}
              >
                <PixelIcon name="star" scale={2} /> {t('menu.save')}
              </button>
              {saved && <span class="nq-menu-saved">{t('field.saveDone')}</span>}
              <button type="button" class="nq-opt nq-parent-open" onClick={onParent}>
                ⚙ {t('menu.parent')}
              </button>
            </div>
          </>
        ) : tab === 'roadmap' ? (
          <RoadmapView nodes={roadmap} onSelect={onRoadmapSelect} />
        ) : (
          <>
            {(tab === 'monsters' || tab === 'specialties') && (
              <div class="nq-menu-subtabs" role="group" aria-label={t('field.dexGroup')}>
                <button
                  type="button"
                  class={`nq-opt ${tab === 'monsters' ? 'nq-focus' : ''}`}
                  aria-pressed={tab === 'monsters'}
                  onClick={() => onTab('monsters')}
                >
                  {t('field.tabMonsters')}
                </button>
                <button
                  type="button"
                  class={`nq-opt ${tab === 'specialties' ? 'nq-focus' : ''}`}
                  aria-pressed={tab === 'specialties'}
                  onClick={() => onTab('specialties')}
                >
                  {t('field.tabSpecialties')}
                </button>
              </div>
            )}
            {isDex && groups.length > 0 && (
              <div class="nq-dex-regions" role="group" aria-label={displayText(t('field.dexRegions'))}>
                {groups.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    class={`nq-opt ${id === activeGroup ? 'nq-focus' : ''}`}
                    aria-pressed={id === activeGroup}
                    onClick={() => selectDexGroup(id)}
                  >
                    <RubyLabel text={label} />
                  </button>
                ))}
              </div>
            )}
            <div class="nq-menu-body">
              <div class="nq-wmap-left">
                {summary && <RubyLabel text={summary} class="nq-menu-summary" as="p" />}
                {entries.length ? (
                  <ul class={`nq-party-list nq-town-list ${isDex ? 'nq-dex-grid' : ''}`} ref={listRef}>
                    {visibleEntries.map((x) => {
                      const k = entries.indexOf(x);
                      return (
                        <MenuListRow key={x.key} entry={x} index={k} selected={k === sel} onPick={pick} />
                      );
                    })}
                  </ul>
                ) : (
                  <RubyLabel text={empty} class="nq-town-empty" as="p" />
                )}
              </div>

              <div class="nq-wmap-right">
                {message && <RubyLabel text={message} class="nq-party-msg" as="p" />}
                {e && (
                  <div class={`nq-wmap-info nq-party-info ${isDex ? 'nq-dex-info' : ''}`}>
                    <div class="nq-party-head">
                      <div class={`nq-party-art ${e.known ? '' : 'nq-menu-unknown-art'}`}>
                        {pic ? <img src={pic} alt="" /> : <PixelIcon name="star-off" scale={6} />}
                      </div>
                      <div class="nq-party-who">
                        <div class="nq-dex-name-row">
                          <RubyLabel text={e.name} class="nq-party-name" />
                          {e.bagSize && <BagFootprint size={e.bagSize} />}
                        </div>
                        {e.detailIndex && <span class="nq-menu-detail-count">{e.detailIndex}</span>}
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
                {!isDex && <RubyLabel class="nq-wmap-keys" text={keys} />}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BagFootprint({ size }: { size: { w: number; h: number } }) {
  const count = size.w * size.h;
  return (
    <span
      class={`nq-dex-bag-size nq-dex-bag-${size.w}x${size.h}`}
      aria-label={t('field.bagCost', { n: count })}
    >
      <span class="nq-dex-bag-cells" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <i key={index} />
        ))}
      </span>
    </span>
  );
}
