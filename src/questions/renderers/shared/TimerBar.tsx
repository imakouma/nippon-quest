import { useEffect, useRef, useState } from 'preact/hooks';

export interface TimerBarProps {
  ms: number;
  running: boolean;
  onTimeout: () => void;
}

/** 制限時間バー。「気持ち急かす程度」（GDD §4.3）。残り 25% で色が変わる */
export function TimerBar({ ms, running, onTimeout }: TimerBarProps) {
  const [left, setLeft] = useState(ms);
  const start = useRef(performance.now());
  const fired = useRef(false);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const l = Math.max(0, ms - (performance.now() - start.current));
      setLeft(l);
      if (l <= 0 && !fired.current) {
        fired.current = true;
        onTimeout();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms, running, onTimeout]);
  const pct = (left / ms) * 100;
  return (
    <div class="nq-timer" role="timer" aria-label={`のこり ${Math.ceil(left / 1000)} びょう`}>
      <div class={`nq-timer-fill ${pct < 25 ? 'nq-timer-low' : ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
