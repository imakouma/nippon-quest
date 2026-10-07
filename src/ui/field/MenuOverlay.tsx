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
import { playSfx } from '../sfx';
import { MenuCategoryIcon } from './MenuCategoryIcon';
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
  keys: string;
  onTab: (tab: MenuTab) => void;
  onBag: () => void;
  onAct: (key: string) => void;
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
          class={`nq-opt ${selected ? 'nq-focus' : ''} ${entry.known ? '' : 'nq-menu-unknown'}`}
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
  keys,
  onTab,
  onBag,
  onAct,
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
  const [home, setHome] = useState(true);
  const [saved, setSaved] = useState(false);
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
  const e = entries[Math.min(sel, entries.length - 1)];
  const listRef = useRef<HTMLUListElement>(null);
  const homeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (home) homeButtonRef.current?.focus();
  }, [home, homeSel]);

  const pick = useCallback<MenuPick>(
    (k, ensureVisible = false) => {
      if (!entries[k]) return;
      setSel((current) => {
        if (k === current) return current;
        playSfx('move');
        if (ensureVisible)
          requestAnimationFrame(() => listRef.current?.children[k]?.scrollIntoView({ block: 'nearest' }));
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
  });
  live.current = { pick, act, openTab, backToHome, onClose, sel, n: entries.length, home, homeSel };
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const L = live.current;
      if (L.home) {
        const columns = 5;
        switch (ev.key) {
          case 'ArrowLeft':
            setHomeSel((current) => (current - 1 + tabs.length) % tabs.length);
            playSfx('move');
            break;
          case 'ArrowRight':
            setHomeSel((current) => (current + 1) % tabs.length);
            playSfx('move');
            break;
          case 'ArrowUp':
            setHomeSel((current) => (current - columns + tabs.length) % tabs.length);
            playSfx('move');
            break;
          case 'ArrowDown':
            setHomeSel((current) => (current + columns) % tabs.length);
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
          if (L.n) L.pick((L.sel - 1 + L.n) % L.n, true);
          break;
        case 'ArrowDown':
          if (L.n) L.pick((L.sel + 1) % L.n, true);
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
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
        class="nq-win nq-wmap-box nq-menu-box"
        role="dialog"
        aria-modal="true"
        aria-label={t('field.menu')}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div class="nq-menu-head">
          <span class="nq-menu-title">
            <PixelIcon name="cmd-item" scale={2} />
            {t('field.menu')}
          </span>
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
            <div class="nq-menu-home" aria-label={t('field.menu')}>
              {tabs.map((x, index) => (
                <button
                  key={x.key}
                  ref={index === homeSel ? homeButtonRef : undefined}
                  type="button"
                  class={`nq-menu-card nq-menu-card-${x.key} ${index === homeSel ? 'nq-focus' : ''}`}
                  onPointerEnter={() => setHomeSel(index)}
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
          <RoadmapView nodes={roadmap} />
        ) : (
          <>
            {(tab === 'monsters' || tab === 'specialties') && (
              <div class="nq-menu-subtabs" aria-label={t('field.dexGroup')}>
                <button
                  type="button"
                  class={`nq-opt ${tab === 'monsters' ? 'nq-focus' : ''}`}
                  onClick={() => onTab('monsters')}
                >
                  {t('field.tabMonsters')}
                </button>
                <button
                  type="button"
                  class={`nq-opt ${tab === 'specialties' ? 'nq-focus' : ''}`}
                  onClick={() => onTab('specialties')}
                >
                  {t('field.tabSpecialties')}
                </button>
              </div>
            )}
            <div class="nq-menu-body">
              <div class="nq-wmap-left">
                {summary && <RubyLabel text={summary} class="nq-menu-summary" as="p" />}
                {entries.length ? (
                  <ul class="nq-party-list nq-town-list" ref={listRef}>
                    {entries.map((x, k) => (
                      <MenuListRow key={x.key} entry={x} index={k} selected={k === sel} onPick={pick} />
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
                <RubyLabel class="nq-wmap-keys" text={keys} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RoadmapView({ nodes }: { nodes: RoadmapNode[] }) {
  const subjects = [...new Map(nodes.map((node) => [node.subject, node.subjectLabel])).entries()];
  const [subject, setSubject] = useState('all');
  const shown = subject === 'all' ? nodes : nodes.filter((node) => node.subject === subject);
  const completed = shown.filter((node) => node.state === 'cleared').length;
  return (
    <section class={`nq-roadmap nq-roadmap-subject-${subject}`} aria-label="がくしゅうロードマップ">
      <div class="nq-roadmap-subjects">
        <button
          type="button"
          class={`nq-opt nq-roadmap-subject ${subject === 'all' ? 'nq-focus' : ''}`}
          aria-pressed={subject === 'all'}
          onClick={() => (playSfx('move'), setSubject('all'))}
        >
          <RubyLabel text={t('field.roadmapAllSubjects')} />
        </button>
        {subjects.map(([key, label]) => (
          <button
            key={key}
            type="button"
            class={`nq-opt nq-roadmap-subject ${key === subject ? 'nq-focus' : ''}`}
            aria-pressed={key === subject}
            onClick={() => (playSfx('move'), setSubject(key))}
          >
            <RubyLabel text={label} />
          </button>
        ))}
        <span class="nq-roadmap-score">
          ★ {completed}/{shown.length}
        </span>
      </div>
      {subject === 'all' ? (
        <div class="nq-roadmap-overview" aria-label={t('field.roadmapAllOverview')}>
          {subjects.map(([key, label]) => {
            const subjectNodes = nodes.filter((node) => node.subject === key);
            const subjectCompleted = subjectNodes.filter((node) => node.state === 'cleared').length;
            const next =
              subjectNodes.find((node) => node.state === 'current') ??
              subjectNodes.find((node) => node.state !== 'cleared');
            const progress = subjectNodes.length
              ? Math.round((subjectCompleted / subjectNodes.length) * 100)
              : 0;
            return (
              <button
                key={key}
                type="button"
                class={`nq-roadmap-summary nq-roadmap-summary-${key}`}
                aria-label={`${label} ${subjectCompleted}/${subjectNodes.length}`}
                onClick={() => (playSfx('move'), setSubject(key))}
              >
                <span class="nq-roadmap-summary-head">
                  <RubyLabel text={label} />
                  <span>
                    ★ {subjectCompleted}/{subjectNodes.length}
                  </span>
                </span>
                <span class="nq-roadmap-summary-meter" aria-hidden>
                  <span style={{ width: `${progress}%` }} />
                </span>
                <RubyLabel
                  class="nq-roadmap-summary-current"
                  text={next ? t('field.roadmapNext', { name: next.name }) : t('field.roadmapCompleted')}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <div class="nq-roadmap-map">
          <div class="nq-roadmap-path">
            {shown.map((node, index) => {
              const columns = 6;
              const row = Math.floor(index / columns);
              const offset = index % columns;
              const column = row % 2 === 0 ? offset + 1 : columns - offset;
              const turnsToNextRow = offset === columns - 1 && index < shown.length - 1;
              const roadFromPrevious =
                offset === 0 ? '' : row % 2 === 0 ? ' nq-roadmap-from-left' : ' nq-roadmap-from-right';
              return (
                <div
                  key={node.id}
                  class={`nq-roadmap-node nq-roadmap-${node.state}${roadFromPrevious}${turnsToNextRow ? ' nq-roadmap-turn' : ''}`}
                  style={{ gridColumn: column, gridRow: row + 1 }}
                  title={`${node.name} ${Math.round(node.mastery * 100)}%`}
                >
                  <span class="nq-roadmap-step">
                    {node.state === 'cleared' ? '★' : node.state === 'locked' ? '🔒' : index + 1}
                  </span>
                  <RubyLabel text={node.name} class="nq-roadmap-node-name" />
                  <span class="nq-roadmap-meter">
                    <span style={{ width: `${Math.round(node.mastery * 100)}%` }} />
                  </span>
                </div>
              );
            })}
          </div>
          {!shown.length && <RubyLabel text="この きょうかは じゅんびちゅう" />}
        </div>
      )}
      <RubyLabel
        class="nq-wmap-keys nq-roadmap-help"
        text="★ クリア　● いまの もくひょう　うすいマスは これから"
      />
    </section>
  );
}
