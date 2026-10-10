/**
 * バッグ：左の上に 主人公、その下に バッグの マス（仲間は しんかの だんかい ぶん 1〜3 マス、そうびは 1 マス。
 * あいている マスは 点線、まだ ひらいていない マスは あく レベル）、その下に あずけている 仲間・そうび。
 * えらんで バッグに いれる ⇄ だす、せんとう（バトルで さいしょに出る）に する、しんかさせる。
 * ロジックは持たない（中身は Overworld が GameState と content から作って渡す）。
 * 操作：↑↓←→ えらぶ / Z・Enter いれる・だす / X・Esc とじる。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Element, Item, Stats } from '../../core/content/schemas';
import { ElementChip } from '../chips';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { useModalFocus } from '../useModalFocus';
import type { BagCell } from './bagLayout';
import './field.css';
import './bag.css';

export interface BagThing {
  /** 'hero' / 'mon:<uid>' / 'eq:<部位>'（バッグの そうび）/ 'inv:<itemId>'（あずけている そうび） */
  key: string;
  kind: 'hero' | 'monster' | 'equip' | 'item';
  /** 装備なら、主人公のまわりの決められた装備位置。 */
  equipSlot?: Item['kind'];
  /** 名前（RubyText） */
  name: string;
  /** マス・リストの 小さな 絵（data URL） */
  icon: string | null;
  /** 右の 大きな 絵（data URL）。無ければ icon */
  art: string | null;
  /** つかう マスの数（主人公は 0） */
  cost: number;
  /** 2Dバッグ上の大きさ */
  size?: { w: number; h: number };
  inBag: boolean;
  /** 主人公を含む最大8体の戦闘編成に入っている */
  roster?: boolean;
  /** バトルで さいしょに出る 仲間 */
  leader?: boolean;
  level?: number;
  element?: Element;
  /** あずけている そうびの こすう */
  count?: number;
  stats?: Stats;
  /** 名前の下（そうびの 部位 など） */
  sub?: string;
  lines?: string[];
  skills?: { name: string; gauge: number; scan: boolean }[];
  blurb?: string;
  action?: 'pack';
  /** しんかできる仲間なら、しんか先と条件。room＝バッグに 入りきるか（extra マス ふえる） */
  evolve?: {
    toName: string;
    itemName: string;
    need: number;
    have: number;
    ok: boolean;
    room: boolean;
    extra: number;
  } | null;
}

export interface BagOverlayProps {
  hero: BagThing;
  /** バッグの 中身（仲間 → そうび。マスの じゅん） */
  inBag: BagThing[];
  /** あずけている 仲間・そうび */
  outside: BagThing[];
  cells: BagCell[];
  cols: number;
  rows: number;
  dropSlots: Partial<Record<Item['kind'], { x: number; y: number }>>;
  used: number;
  capacity: number;
  /** マスより 多く 入っている（マスが できる前の セーブ） */
  over: boolean;
  /** つぎに マスが ふえる レベル（もう ふえないなら null） */
  nextLevel: number | null;
  /** さっき えらんでいた もの（いれる・だす・しんかの あとも 同じ ものを えらんだまま） */
  focusKey?: string;
  message: string | null;
  /** しんかした 直後（絵を 光らせる） */
  flashKey?: string;
  onToggle: (key: string) => void;
  onLeader: (key: string) => void;
  onEvolve: (key: string) => void;
  onMove: (key: string, x: number, y: number) => void;
  onRosterRemove: (key: string) => void;
  onClose: () => void;
}

const STATS: [keyof Stats, string][] = [
  ['hp', 'field.statHp'],
  ['atk', 'field.statAtk'],
  ['def', 'field.statDef'],
  ['spd', 'field.statSpd'],
  ['wis', 'field.statWis'],
];

/** つかう マスの数を ■ で */
function Pips({ n }: { n: number }) {
  return (
    <span class="nq-bag-pips" aria-label={t('field.bagCost', { n })}>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}

function Pic({ x, size }: { x: BagThing; size: number }) {
  const src = x.kind === 'hero' ? (x.art ?? x.icon) : size > 3 ? (x.art ?? x.icon) : x.icon;
  if (src) return <img src={src} alt="" />;
  return (
    <PixelIcon
      name={x.kind === 'hero' ? 'hero' : x.kind === 'equip' ? 'cmd-item' : `el-${x.element ?? 'none'}`}
      scale={size}
    />
  );
}

export function BagOverlay({
  hero,
  inBag,
  outside,
  cells,
  cols,
  rows,
  dropSlots,
  used,
  capacity,
  over,
  focusKey,
  message,
  flashKey,
  onToggle,
  onLeader,
  onEvolve,
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
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const sig = order.map((x) => x.key).join(',');
  useEffect(() => setSel(indexOf(focusKey)), [focusKey, sig]);
  const m = order[Math.min(sel, order.length - 1)]!;
  const boxRef = useRef<HTMLDivElement>(null);
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
    setDetailsOpen(true);
    const el = boxRef.current?.querySelector(`[data-bag-key="${CSS.escape(order[k]!.key)}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  };
  const activateKey = (key: string) => {
    const next = indexOf(key);
    if (next === sel) {
      playSfx('back');
      setDetailsOpen((open) => !open);
      return;
    }
    pick(next);
  };
  const toggle = () => {
    if (m.kind === 'hero') {
      playSfx('miss');
      return;
    }
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
        live.current.toggle();
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

  const heart = (x: BagThing) => x.key === m.key && <span class="nq-heart">♥</span>;
  const listRow = (x: BagThing) => (
    <li key={x.key}>
      <button
        type="button"
        data-bag-key={x.key}
        class={`nq-opt ${x.key === m.key ? 'nq-focus' : ''}`}
        draggable={x.kind === 'equip' || (x.kind === 'item' && x.inBag)}
        onDragStart={(e) => {
          e.dataTransfer?.setData('text/plain', x.key);
          setDragKey(x.key);
        }}
        onDragEnd={() => setDragKey(null)}
        onClick={() => activateKey(x.key)}
      >
        <span class="nq-amap-cur">{heart(x)}</span>
        {x.kind === 'equip' || x.kind === 'item' ? (
          <img class="nq-item-icon nq-town-icon" src={x.icon ?? ''} alt="" />
        ) : (
          <PixelIcon name={x.kind === 'hero' ? 'hero' : `el-${x.element ?? 'none'}`} scale={2} />
        )}
        <RubyLabel text={x.name} class="nq-opt-name" />
        {x.level !== undefined && (
          <span class="nq-party-lv">
            {t('battle.lv')}
            {x.level}
          </span>
        )}
        {x.count !== undefined && x.count > 1 && (
          <span class="nq-party-lv">{t('battle.itemCount', { n: x.count })}</span>
        )}
        {x.evolve?.ok && x.evolve.room && (
          <span class="nq-party-tag nq-party-tag-evo">{t('field.partyCanEvolve')}</span>
        )}
        {x.cost > 0 && <Pips n={x.cost} />}
      </button>
    </li>
  );
  const reserveTile = (x: BagThing) => (
    <li key={x.key}>
      <button
        type="button"
        data-bag-key={x.key}
        class={`nq-bag-reserve-tile ${x.key === m.key ? 'nq-focus' : ''}`}
        draggable={x.kind === 'equip'}
        aria-pressed={x.key === m.key && detailsOpen}
        onDragStart={(e) => {
          e.dataTransfer?.setData('text/plain', x.key);
          setDragKey(x.key);
        }}
        onDragEnd={() => setDragKey(null)}
        onClick={() => {
          const next = indexOf(x.key);
          if (next !== sel) {
            playSfx('move');
            setSel(next);
          }
          setDetailsOpen(true);
        }}
      >
        <span class="nq-bag-reserve-pic">
          <Pic x={x} size={3} />
          {x.key === m.key && <span class="nq-heart nq-bag-reserve-heart">♥</span>}
        </span>
        <RubyLabel text={x.name} class="nq-bag-reserve-name" />
        {x.count !== undefined && x.count > 1 && <span class="nq-bag-reserve-count">×{x.count}</span>}
      </button>
    </li>
  );

  const monsInBag = inBag.some((x) => x.kind === 'monster');
  const itemsInBag = inBag.filter((x) => x.kind === 'item');
  const canReturnItem = !!dragKey && byKey.get(dragKey)?.kind === 'item' && !!byKey.get(dragKey)?.inBag;
  const returnItem = () => {
    if (!canReturnItem || !dragKey) return;
    onToggle(dragKey);
    setDragKey(null);
  };
  return (
    <div class="nq-wmap" onClick={onClose}>
      <div
        class={`nq-win nq-wmap-box ${detailsOpen ? '' : 'nq-bag-details-closed'}`}
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('field.bagTitle')}
        tabindex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="nq-wmap-left nq-bag-left">
          <div class="nq-wmap-region">
            <span class="nq-wmap-title">
              <PixelIcon name="cmd-item" scale={3} />
              {t('field.bagTitle')}
            </span>
          </div>
          <p
            class={`nq-bag-capacity ${over ? 'nq-bag-capacity-warning' : ''}`}
            role={over ? 'alert' : 'status'}
          >
            <span>{t('field.bagCapacity', { used, capacity })}</span>
            {over && <strong>{t('field.bagLayoutInvalid')}</strong>}
          </p>
          <div
            class="nq-bag-grid"
            role="group"
            aria-label={t('field.bagTitle')}
            style={{
              gridTemplateColumns: `repeat(${cols}, 76px)`,
              gridTemplateRows: `repeat(${rows}, 76px)`,
            }}
          >
            {cells.map((c, i) => {
              if (c.kind === 'empty') {
                const slot = Object.entries(dropSlots).find(
                  ([, pos]) => pos?.x === c.x && pos.y === c.y,
                )?.[0];
                const dragged = dragKey ? byKey.get(dragKey) : undefined;
                const canDrop =
                  !dragged || dragged.inBag || (dragged.equipSlot === slot && dragged.kind === 'equip');
                return (
                  <div
                    key={`e${i}`}
                    class={`nq-bag-cell nq-bag-empty ${dragKey && canDrop ? 'nq-bag-drop-ok' : ''}`}
                    data-drop-slot={slot}
                    style={{ gridColumn: c.x + 1, gridRow: c.y + 1 }}
                    aria-label={t('field.bagEmptyCell')}
                    onClick={() => {
                      if (m.kind !== 'hero' && m.inBag) onMove(m.key, c.x, c.y);
                    }}
                    onDragOver={(e) => {
                      if (canDrop) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const key = e.dataTransfer?.getData('text/plain');
                      if (!key) return;
                      const thing = byKey.get(key);
                      if (!thing || (!thing.inBag && thing.equipSlot !== slot)) return;
                      if (thing.inBag) onMove(key, c.x, c.y);
                      else onToggle(key);
                      setDragKey(null);
                    }}
                  />
                );
              }
              const x = byKey.get(c.key);
              if (!x) return null;
              return (
                <button
                  key={x.key}
                  type="button"
                  data-bag-key={x.key}
                  class={`nq-bag-cell nq-bag-item nq-bag-${x.kind} ${x.key === m.key ? 'nq-focus' : ''}`}
                  style={{ gridColumn: `${c.x + 1} / span ${c.w}`, gridRow: `${c.y + 1} / span ${c.h}` }}
                  draggable={x.kind !== 'hero'}
                  onDragStart={(e) => {
                    e.dataTransfer?.setData('text/plain', x.key);
                    setDragKey(x.key);
                  }}
                  onDragEnd={() => setDragKey(null)}
                  aria-label={displayText(x.name)}
                  onClick={() => activateKey(x.key)}
                >
                  <Pic x={x} size={2} />
                  {x.key === m.key && <span class="nq-heart nq-bag-heart">♥</span>}
                  {x.leader && <span class="nq-bag-lead">{t('field.partyLeader')}</span>}
                  {x.evolve?.ok && x.evolve.room && <span class="nq-bag-evo">★</span>}
                </button>
              );
            })}
          </div>
          {!!itemsInBag.length && (
            <>
              <p class="nq-party-sep nq-bag-sep">{t('field.bagBattleItems')}</p>
              <ul class="nq-party-list nq-bag-packed">{itemsInBag.map(listRow)}</ul>
            </>
          )}
          <p
            class={`nq-party-sep nq-bag-sep ${canReturnItem ? 'nq-bag-return-ok' : ''}`}
            onDragOver={(e) => {
              if (canReturnItem) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              returnItem();
            }}
          >
            {t('field.bagOutside')}
          </p>
          <ul
            class={`nq-bag-reserve-grid ${canReturnItem ? 'nq-bag-return-ok' : ''}`}
            onDragOver={(e) => {
              if (canReturnItem) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              returnItem();
            }}
          >
            {outside.length ? (
              outside.map(reserveTile)
            ) : (
              <li class="nq-party-none">{t('field.bagOutsideNone')}</li>
            )}
          </ul>
        </div>

        <div class="nq-wmap-right">
          <div class="nq-wmap-head">
            {message ? <RubyLabel text={message} class="nq-party-msg" /> : <span />}
            <button type="button" class="nq-back" onClick={onClose}>
              × {t('ui.close')}
            </button>
          </div>
          {detailsOpen && (
            <div class="nq-wmap-info nq-party-info">
              <div class="nq-party-head">
                <div class={`nq-party-art ${flashKey === m.key ? 'nq-party-evolved' : ''}`}>
                  <Pic x={m} size={6} />
                </div>
                <div class="nq-party-who">
                  <RubyLabel text={m.name} class="nq-party-name" />
                  <span class="nq-party-sub">
                    {m.level !== undefined && (
                      <>
                        {t('battle.lv')}
                        {m.level}
                      </>
                    )}
                    {m.kind === 'monster' && m.element && <ElementChip el={m.element} />}
                    {m.sub && <RubyLabel text={m.sub} />}
                    {m.cost > 0 && (
                      <span class="nq-bag-costline">
                        <Pips n={m.cost} />
                        {t('field.bagCost', { n: m.cost })}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              {m.stats && (
                <div class="nq-party-stats">
                  {STATS.map(([k, key]) => (
                    <span key={k}>
                      <small>{t(key)}</small>
                      {Math.round(m.stats![k])}
                    </span>
                  ))}
                </div>
              )}
              {m.lines?.map((l, i) => (
                <RubyLabel key={i} text={l} class="nq-bag-line" as="p" />
              ))}
              {!!m.skills?.length && (
                <>
                  <p class="nq-party-label">
                    <RubyLabel text={t('cmd.skill')} />
                  </p>
                  <ul class="nq-party-skills">
                    {m.skills.map((s, i) => (
                      <li key={i}>
                        <RubyLabel text={s.name} />
                        <span class="nq-party-star">{s.scan ? '' : '★'.repeat(s.gauge)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {m.kind === 'hero' && !monsInBag && (
                <RubyLabel text={t('field.bagNoMonster')} class="nq-party-hint" as="p" />
              )}
              {m.blurb && <RubyLabel text={m.blurb} class="nq-party-blurb" as="p" />}
            </div>
          )}
          {detailsOpen && m.kind !== 'hero' && (m.kind !== 'item' || m.action) && (
            <div class="nq-wmap-foot nq-party-foot">
              <button type="button" class="nq-opt nq-wmap-go" onClick={toggle}>
                <PixelIcon name="cmd-item" scale={3} />
                {t(m.inBag ? 'field.bagOut' : 'field.bagIn')}
              </button>
              {m.kind === 'monster' && m.inBag && !m.leader && (
                <button type="button" class="nq-opt nq-wmap-go" onClick={leader}>
                  <PixelIcon name="hero" scale={3} />
                  {t('field.partySetLeader')}
                </button>
              )}
              {m.kind === 'monster' && !m.inBag && m.roster && (
                <button type="button" class="nq-opt nq-wmap-go" onClick={() => onRosterRemove(m.key)}>
                  <PixelIcon name="cmd-item" scale={3} />
                  {t('field.bagRosterRemove')}
                </button>
              )}
              {m.evolve && (
                <button
                  type="button"
                  class={`nq-opt nq-wmap-go nq-party-evolve ${m.evolve.ok && m.evolve.room ? 'nq-party-evolve-ok' : ''}`}
                  disabled={!m.evolve.ok || !m.evolve.room}
                  onClick={evolve}
                >
                  <PixelIcon name="star" scale={3} />
                  {t('field.partyEvolve')}
                </button>
              )}
            </div>
          )}
          {detailsOpen && m.evolve && (
            <RubyLabel
              class="nq-wmap-keys"
              text={
                m.evolve.ok && !m.evolve.room
                  ? t('field.bagEvolveNoRoom', { n: m.evolve.extra })
                  : t(m.evolve.ok ? 'field.partyEvolveNeed' : 'field.partyEvolveNo', {
                      item: m.evolve.itemName,
                      to: m.evolve.toName,
                      need: m.evolve.need,
                      n: m.evolve.have,
                    })
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
