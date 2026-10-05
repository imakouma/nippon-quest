/**
 * メニュー：モンスターずかん・とくさんひんずかん・どうぐ（バッグ）・そうび・みため を タブで きりかえて見る。
 * ロジックは持たない（中身は Overworld が GameState と content から作って渡す）。
 * 操作：←→ タブ / ↑↓ えらぶ / Z・Enter つかう・そうびする・はずす / X・Esc とじる。
 */
import { Component } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { MenuEntry, MenuTab, RoadmapNode } from '../../shared/menuModel';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';
import { useModalFocus } from '../useModalFocus';
import './field.css';
import './menu.css';

export type { MenuEntry, MenuTab, RoadmapNode } from '../../shared/menuModel';

export interface MenuOverlayProps {
  tab: MenuTab;
  /** group があると、その なかまの さいしょの タブの 前に 小さな 見出し（「ずかん」）を出す */
  tabs: { key: MenuTab; label: string; icon: string; count?: string; group?: string }[];
  entries: MenuEntry[];
  roadmap?: RoadmapNode[];
  /** リストの上に出す 行（そうびの タブの ステータス など） */
  summary?: string;
  empty: string;
  message: string | null;
  focusKey?: string;
  keys: string;
  onTab: (tab: MenuTab) => void;
  onAct: (key: string) => void;
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
  onAct,
  onParent,
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(dialogRef, '[role="tab"][aria-selected="true"]');

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
          if (L.n) L.pick((L.sel - 1 + L.n) % L.n, true);
          break;
        case 'ArrowDown':
          if (L.n) L.pick((L.sel + 1) % L.n, true);
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
      <div
        ref={dialogRef}
        class="nq-win nq-wmap-box nq-menu-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nq-menu-title"
        tabIndex={-1}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div class="nq-menu-head">
          <span id="nq-menu-title" class="nq-menu-title">
            <PixelIcon name="cmd-item" scale={2} />
            {t('field.menu')}
          </span>
          <button type="button" class="nq-opt nq-parent-open" onClick={onParent}>
            ⚙ {t('menu.parent')}
          </button>
          <button type="button" class="nq-back nq-menu-close" onClick={onClose}>
            × {t('ui.close')}
          </button>
        </div>
        <div class="nq-menu-tabs" role="tablist">
          {tabs.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={x.key === tab}
              class={`nq-opt nq-menu-tab ${x.key === tab ? 'nq-focus' : ''}`}
              onClick={() => x.key !== tab && (playSfx('move'), onTab(x.key))}
            >
              <PixelIcon name={x.icon} scale={1} />
              <RubyLabel text={x.label} />
            </button>
          ))}
        </div>
        {tab === 'roadmap' ? (
          <RoadmapView nodes={roadmap} />
        ) : (
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
          <div class="nq-roadmap-water" aria-hidden>
            ≈ ≈ ≈
          </div>
          <div class="nq-roadmap-path">
            {shown.map((node, index) => {
              const columns = 6;
              const row = Math.floor(index / columns);
              const offset = index % columns;
              const column = row % 2 === 0 ? offset + 1 : columns - offset;
              return (
                <div
                  key={node.id}
                  class={`nq-roadmap-node nq-roadmap-${node.state}`}
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
