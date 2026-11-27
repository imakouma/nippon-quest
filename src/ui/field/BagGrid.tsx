import { t } from '../i18n';
import { displayText } from '../ruby';
import { Pic } from './BagVisuals';
import type { BagOverlayProps, BagThing } from './bagTypes';
import type { BagCell } from './bagLayout';

type Position = { x: number; y: number };
/** Preview the same footprint the board renders; the core validates the final placement. */
export function dropProblem(
  thing: BagThing,
  pos: Position,
  cells: BagCell[],
  cols: number,
  rows: number,
  slots: BagOverlayProps['dropSlots'],
): string | null {
  if (thing.blockedReason) return thing.blockedReason;
  if (thing.kind === 'hero') return t('field.bagPlaceBlocked');
  if (thing.kind === 'item') return thing.action === 'pack' ? null : t('field.bagStorageOnly');
  if (thing.kind === 'equip' && !thing.inBag) {
    const slot = thing.equipSlot && slots[thing.equipSlot];
    if (!slot || slot.x !== pos.x || slot.y !== pos.y) return t('field.bagEquipPlace');
  }
  const current = cells.find((c) => c.kind === 'item' && c.key === thing.key);
  const size = current?.kind === 'item' ? current : (thing.size ?? { w: Math.max(1, thing.cost), h: 1 });
  if (pos.x < 0 || pos.y < 0 || pos.x + size.w > cols || pos.y + size.h > rows)
    return t('field.bagPlaceBlocked');
  if (
    cells.some(
      (c) =>
        c.kind === 'item' &&
        c.key !== thing.key &&
        pos.x < c.x + c.w &&
        pos.x + size.w > c.x &&
        pos.y < c.y + c.h &&
        pos.y + size.h > c.y,
    )
  )
    return t('field.bagPlaceBlocked');
  return null;
}

type Props = Pick<BagOverlayProps, 'cells' | 'cols' | 'rows' | 'dropSlots'> & {
  byKey: Map<string, BagThing>;
  selected: BagThing;
  dragged?: BagThing;
  setDragKey: (key: string | null) => void;
  activateKey: (key: string) => void;
  place: (thing: BagThing, x: number, y: number) => void;
  pack: (thing: BagThing) => void;
};
export function BagGrid({
  cells,
  cols,
  rows,
  dropSlots,
  byKey,
  selected,
  dragged,
  setDragKey,
  activateKey,
  place,
  pack,
}: Props) {
  const candidate = dragged ?? selected;
  return (
    <div
      class="nq-bag-grid"
      role="group"
      aria-label={t('field.bagTitle')}
      style={{
        gridTemplateColumns: `repeat(${cols}, 64px)`,
        gridTemplateRows: `repeat(${rows}, 64px)`,
      }}
      onDragOver={(e) => {
        if (dragged?.action === 'pack') e.preventDefault();
      }}
      onDrop={(e) => {
        if (dragged?.action === 'pack') {
          e.preventDefault();
          pack(dragged);
        }
      }}
    >
      {cells.map((c, i) => {
        const thing = c.kind === 'item' ? byKey.get(c.key) : undefined;
        const slot = Object.entries(dropSlots).find(([, pos]) => pos?.x === c.x && pos.y === c.y)?.[0];
        const possible =
          candidate.kind !== 'item' && !dropProblem(candidate, c, cells, cols, rows, dropSlots);
        return (
          <button
            key={c.kind === 'item' ? c.key : `e${i}`}
            type="button"
            class={`nq-bag-cell ${thing ? `nq-bag-item nq-bag-${thing.kind}` : 'nq-bag-empty'} ${thing?.key === selected.key ? 'nq-focus' : possible ? 'nq-bag-drop-ok' : ''}`}
            style={{
              gridColumn: c.kind === 'item' ? `${c.x + 1} / span ${c.w}` : c.x + 1,
              gridRow: c.kind === 'item' ? `${c.y + 1} / span ${c.h}` : c.y + 1,
            }}
            data-bag-key={thing?.key}
            data-drop-slot={slot}
            data-cell-x={c.x}
            data-cell-y={c.y}
            aria-label={
              thing
                ? displayText(thing.name)
                : slot
                  ? displayText(t(`slots.${slot}`))
                  : t('field.bagEmptyCell')
            }
            draggable={!!thing && thing.kind !== 'hero'}
            onDragStart={(e) => {
              if (thing) {
                e.dataTransfer?.setData('text/plain', thing.key);
                setDragKey(thing.key);
              }
            }}
            onDragEnd={() => setDragKey(null)}
            onDragOver={(e) => {
              if (dragged) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const key = e.dataTransfer?.getData('text/plain');
              const x = key ? byKey.get(key) : dragged;
              if (x) place(x, c.x, c.y);
            }}
            onClick={() => (thing ? activateKey(thing.key) : place(selected, c.x, c.y))}
          >
            {thing ? (
              <>
                <Pic x={thing} size={2} centerVisible={thing.kind === 'hero'} />
                {thing.key === selected.key && <span class="nq-heart nq-bag-heart">♥</span>}
                {thing.leader && <span class="nq-bag-lead">{t('field.partyLeader')}</span>}
                {thing.evolve?.ok && thing.evolve.room && <span class="nq-bag-evo">★</span>}
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
