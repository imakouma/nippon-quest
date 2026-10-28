import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';

export type VirtualStickDirection = 'left' | 'right' | 'up' | 'down';

export function virtualStickDirection(x: number, y: number, deadZone = 0.22): VirtualStickDirection | null {
  if (Math.hypot(x, y) < deadZone) return null;
  return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : y < 0 ? 'up' : 'down';
}

type StickEvent = JSX.TargetedPointerEvent<HTMLDivElement>;

export function VirtualStick({
  label,
  onDirection,
}: {
  label: string;
  onDirection: (direction: VirtualStickDirection | null) => void;
}) {
  const pointerId = useRef<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => () => onDirection(null), []);

  const update = (event: StickEvent): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = Math.max(1, rect.width * 0.32);
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(dx, dy);
    const scale = length > radius ? radius / length : 1;
    const x = (dx * scale) / radius;
    const y = (dy * scale) / radius;
    setOffset({ x, y });
    onDirection(virtualStickDirection(x, y));
  };

  const release = (event: StickEvent): void => {
    if (pointerId.current !== event.pointerId) return;
    pointerId.current = null;
    setOffset({ x: 0, y: 0 });
    setActive(false);
    onDirection(null);
  };

  return (
    <div
      class={`nq-virtual-stick ${active ? 'is-active' : ''}`}
      role="group"
      aria-label={label}
      // Phaser also listens for window touchstart; the stick owns this gesture.
      onTouchStart={(event) => event.stopPropagation()}
      onPointerDown={(event) => {
        if (pointerId.current !== null) return;
        event.preventDefault();
        pointerId.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        setActive(true);
        update(event);
      }}
      onPointerMove={(event) => {
        if (pointerId.current === event.pointerId) update(event);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <span class="nq-virtual-stick-cross" aria-hidden="true" />
      <span
        class="nq-virtual-stick-knob"
        aria-hidden="true"
        style={{ transform: `translate(calc(-50% + ${offset.x * 40}px), calc(-50% + ${offset.y * 40}px))` }}
      />
    </div>
  );
}
