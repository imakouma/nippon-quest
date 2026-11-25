import { useEffect, useRef } from 'preact/hooks';
import type { VirtualStickDirection } from './VirtualStick';
import { t } from '../i18n';

const directions = [
  ['up', '▲', 'field.moveUp'],
  ['left', '◀', 'field.moveLeft'],
  ['right', '▶', 'field.moveRight'],
  ['down', '▼', 'field.moveDown'],
] as const;

export function DirectionPad({
  onDirection,
}: {
  onDirection: (direction: VirtualStickDirection | null) => void;
}) {
  const pointer = useRef<number | null>(null);
  useEffect(() => () => onDirection(null), []);
  return (
    <div
      class="nq-direction-pad"
      role="group"
      aria-label={t('field.movePad')}
      onTouchStart={(event) => event.stopPropagation()}
    >
      {directions.map(([direction, arrow, label]) => (
        <button
          type="button"
          class={`nq-direction-pad-${direction}`}
          aria-label={t(label)}
          onPointerDown={(event) => {
            if (pointer.current !== null) return;
            event.preventDefault();
            event.stopPropagation();
            pointer.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            onDirection(direction);
          }}
          onPointerUp={(event) => {
            if (pointer.current !== event.pointerId) return;
            pointer.current = null;
            onDirection(null);
          }}
          onPointerCancel={(event) => {
            if (pointer.current !== event.pointerId) return;
            pointer.current = null;
            onDirection(null);
          }}
          onLostPointerCapture={(event) => {
            if (pointer.current !== event.pointerId) return;
            pointer.current = null;
            onDirection(null);
          }}
        >
          {arrow}
        </button>
      ))}
    </div>
  );
}
