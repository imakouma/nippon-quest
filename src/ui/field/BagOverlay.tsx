/** 持ち物・配置・詳細を同時に表示し、操作はSceneのcallbackへ渡す。 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { useModalFocus } from '../useModalFocus';
import type { BagThing, BagOverlayProps } from './bagTypes';
import { BagDetails } from './BagDetails';
import { BagGrid, dropProblem } from './BagGrid';
import { Pic } from './BagVisuals';
import './field.css';
import './bag.css';

export type { BagThing, BagOverlayProps } from './bagTypes';
export function BagOverlay({
  hero,
  inBag,
  outside,
  cells,
  cols,
  rows,
  over,
  focusKey,
  message,
  flashKey,
  onToggle,
  onUse,
  onLeader,
  onEvolve,
  onGrow,
  onMove,
  onRosterRemove,
  onClose,
}: BagOverlayProps) {
  // ↑↓ の じゅん：主人公 → バッグの 中身 → あずけている もの
  const order = [hero, ...inBag, ...outside];
  const byKey = new Map(order.map((x) => [x.key, x]));
  const indexOf = (key?: string) =>
    Math.max(
      0,
      order.findIndex((x) => x.key === key),
    );
  const [sel, setSel] = useState(() => indexOf(focusKey));
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [dragKey, setDragKey] = useState<string | null>(null);
  const sig = order.map((x) => x.key).join(',');
  useEffect(() => setSel(indexOf(focusKey)), [focusKey, sig]);
  const m = order[Math.min(sel, order.length - 1)]!;
  const boxRef = useRef<HTMLDivElement>(null);
  const pouchRef = useRef<HTMLUListElement>(null);
  useModalFocus(boxRef, '[data-bag-key].nq-focus');

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      boxRef.current?.querySelector<HTMLElement>('[data-bag-key].nq-focus')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [m.key]);

  const pick = (k: number) => {
    if (k === sel || !order[k]) return;
    playSfx('move');
    setSel(k);
    setNotice(null);
    const el = boxRef.current?.querySelector(`[data-bag-key="${CSS.escape(order[k]!.key)}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  };
  const activateKey = (key: string) => {
    pick(indexOf(key));
  };
  const toggle = () => {
    if (m.kind === 'hero' || m.blockedReason || (m.kind === 'item' && m.action !== 'pack')) {
      playSfx('miss');
      return;
    }
    setNotice(null);
    playSfx('select');
    onToggle(m.key);
  };
  const leader = () => {
    if (m.kind !== 'monster' || !m.inBag || m.leader) {
      playSfx('miss');
      return;
    }
    playSfx('select');
    onLeader(m.key);
  };
  const evolve = () => {
    if (!m.evolve?.ok || !m.evolve.room) {
      playSfx('miss');
      return;
    }
    onEvolve(m.key);
  };

  const live = useRef({ pick, toggle, onClose, sel, n: order.length });
  live.current = { pick, toggle, onClose, sel, n: order.length };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isConfirm = e.key === 'Enter' || e.key === ' ';
      const selectedItem = e.target instanceof HTMLElement && e.target.closest<HTMLElement>('[data-bag-key]');
      if (isConfirm && selectedItem) {
        e.preventDefault();
        selectedItem.click();
        return;
      }
      if (
        isConfirm &&
        e.target instanceof HTMLElement &&
        e.target.closest('button, input, select, textarea, [contenteditable="true"]')
      )
        return;
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
          L.toggle();
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

  const reserveTile = (x: BagThing) => (
    <li key={x.key}>
      <button
        type="button"
        data-bag-key={x.key}
        class={`nq-bag-reserve-tile ${x.key === m.key ? 'nq-focus' : ''}`}
        draggable={!x.blockedReason && (x.kind !== 'item' || x.action === 'pack')}
        aria-pressed={x.key === m.key}
        aria-label={displayText(x.name)}
        onDragStart={(e) => {
          e.dataTransfer?.setData('text/plain', x.key);
          setDragKey(x.key);
        }}
        onDragEnd={() => setDragKey(null)}
        onClick={() => activateKey(x.key)}
      >
        <span class="nq-bag-reserve-pic">
          <Pic x={x} size={2} />
        </span>
        {x.count !== undefined && x.count > 1 && <span class="nq-bag-reserve-count">×{x.count}</span>}
      </button>
    </li>
  );

  const itemsInBag = inBag.filter((x) => x.kind === 'item');
  const draggedThing = dragKey ? byKey.get(dragKey) : undefined;
  const canReturnItem = !!draggedThing?.inBag && draggedThing.kind !== 'hero';
  const returnItem = () => {
    if (!canReturnItem || !dragKey) return;
    setNotice(null);
    onToggle(dragKey);
    setDragKey(null);
  };
  const pack = (thing: BagThing) => {
    setDragKey(null);
    if (thing.action !== 'pack') {
      setNotice(t('field.bagStorageOnly'));
      return;
    }
    if (thing.inBag) {
      setNotice(t('field.bagToolPlace'));
      return;
    }
    setNotice(null);
    onToggle(thing.key);
  };
  const place = (thing: BagThing, x: number, y: number) => {
    setDragKey(null);
    if (thing.kind === 'item') {
      pack(thing);
      return;
    }
    const problem = dropProblem(thing, { x, y }, cells, cols, rows);
    if (problem) {
      setNotice(problem);
      playSfx('miss');
      return;
    }
    setNotice(null);
    if (thing.inBag) onMove(thing.key, x, y);
    else onToggle(thing.key, { x, y });
  };
  const category = (x: BagThing) => (x.kind === 'item' ? (x.action === 'pack' ? 'tool' : 'storage') : x.kind);
  const shown = outside.filter((x) => filter === 'all' || category(x) === filter);
  return (
    <div class="nq-wmap" onClick={onClose}>
      <div
        class="nq-win nq-wmap-box nq-bag-window"
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('field.bagTitle')}
        tabindex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header class="nq-bag-header">
          <span class="nq-wmap-title">
            <PixelIcon name="cmd-item" scale={3} />
            {t('field.bagTitle')}
          </span>
          <button type="button" class="nq-back" onClick={onClose}>
            × {t('ui.close')}
          </button>
        </header>
        <div class="nq-bag-body">
          <section
            class={`nq-bag-reserve ${canReturnItem ? 'nq-bag-return-ok' : ''}`}
            aria-label={t('field.bagOutside')}
            onDragOver={(e) => {
              if (canReturnItem) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              returnItem();
            }}
          >
            <p class="nq-party-sep nq-bag-sep">{t('field.bagOutside')}</p>
            <div class="nq-bag-filters" role="group" aria-label={displayText(t('field.bagFilter'))}>
              {['all', 'tool', 'equip', 'monster', 'storage'].map((key) => (
                <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>
                  <RubyLabel text={t(`field.bagFilter_${key}`)} />
                </button>
              ))}
            </div>
            <ul class="nq-bag-reserve-grid">
              {shown.length ? (
                shown.map(reserveTile)
              ) : (
                <li class="nq-party-none">{t('field.bagOutsideNone')}</li>
              )}
            </ul>
          </section>
          <section class="nq-bag-board">
            <p class="nq-party-sep nq-bag-sep">{t('field.bagFormation')}</p>
            {over && (
              <p class="nq-bag-capacity-warning" role="alert">
                {t('field.bagLayoutInvalid')}
              </p>
            )}
            <BagGrid
              cells={cells}
              cols={cols}
              rows={rows}
              byKey={byKey}
              selected={m}
              dragged={draggedThing}
              setDragKey={setDragKey}
              activateKey={activateKey}
              place={place}
              pack={pack}
            />
            <p class="nq-bag-place-hint">
              <RubyLabel text={t('field.bagPlaceHint')} />
            </p>
            <section
              class={`nq-bag-pouch ${draggedThing?.kind === 'item' ? 'nq-bag-return-ok' : ''}`}
              aria-label={t('field.bagBattleItems')}
              onDragOver={(e) => {
                if (draggedThing?.action === 'pack') e.preventDefault();
              }}
              onDrop={(e) => {
                if (draggedThing?.action === 'pack') {
                  e.preventDefault();
                  pack(draggedThing);
                }
              }}
            >
              <div class="nq-bag-pouch-heading">
                <p class="nq-party-sep nq-bag-sep">{t('field.bagBattleItems')}</p>
                {itemsInBag.length > 3 && (
                  <span class="nq-bag-pouch-controls">
                    <button
                      type="button"
                      aria-label={displayText(t('field.bagToolsPrevious'))}
                      onClick={() => pouchRef.current?.scrollBy({ left: -150 })}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label={displayText(t('field.bagToolsNext'))}
                      onClick={() => pouchRef.current?.scrollBy({ left: 150 })}
                    >
                      ›
                    </button>
                  </span>
                )}
              </div>
              <ul class="nq-bag-packed" ref={pouchRef}>
                {itemsInBag.length ? (
                  itemsInBag.map((x) => (
                    <li key={x.key}>
                      <button
                        type="button"
                        data-bag-key={x.key}
                        class={`nq-bag-packed-item ${x.key === m.key ? 'nq-focus' : ''}`}
                        aria-label={displayText(x.name)}
                        title={displayText(x.name)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer?.setData('text/plain', x.key);
                          setDragKey(x.key);
                        }}
                        onDragEnd={() => setDragKey(null)}
                        onClick={() => activateKey(x.key)}
                      >
                        <Pic x={x} size={2} />
                        {x.count !== undefined && <span>×{x.count}</span>}
                      </button>
                    </li>
                  ))
                ) : (
                  <li class="nq-party-none">{t('field.bagPouchEmpty')}</li>
                )}
              </ul>
            </section>
          </section>
          <BagDetails
            m={m}
            message={notice ?? message}
            flashKey={flashKey}
            toggle={toggle}
            leader={leader}
            evolve={evolve}
            onGrow={onGrow}
            onUse={onUse}
            onRosterRemove={onRosterRemove}
          />
        </div>
      </div>
    </div>
  );
}
