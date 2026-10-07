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
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!running) return;
    start.current = performance.now();
    fired.current = false;
    setLeft(ms);
    const tick = () => {
      const l = Math.max(0, ms - (performance.now() - start.current));
      setLeft(l);
      if (l <= 0 && !fired.current) {
        fired.current = true;
        onTimeoutRef.current();
      }
    };
    // 60fps の再描画は入力中の問題UIまで巻き込む。100ms刻みなら見た目と採点精度を保てる。
    const id = window.setInterval(tick, 100);
    tick();
    return () => window.clearInterval(id);
  }, [ms, running]);
  const pct = ms > 0 ? (left / ms) * 100 : 0;
  return (
    <div class="nq-timer" role="timer" aria-label={`のこり ${Math.ceil(left / 1000)} びょう`}>
      <div class={`nq-timer-fill ${pct < 25 ? 'nq-timer-low' : ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
