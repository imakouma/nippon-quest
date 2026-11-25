import type { SubjectGaugeView } from './store';

// 下中央から左側を回る。2教科なら左半分・右半分に分かれる。
const FRAME = 'M50 90H24A22 22 0 0 1 2 68V24A22 22 0 0 1 24 2H76A22 22 0 0 1 98 24V68A22 22 0 0 1 76 90Z';

export function ChargeGaugeFrame({ gauges }: { gauges: SubjectGaugeView[] }) {
  const segment = 100 / gauges.length;
  return (
    <svg class="nq-charge-frame" viewBox="0 0 100 92" aria-hidden="true">
      <path class="nq-charge-track" d={FRAME} />
      {gauges.map((g, index) => {
        const ratio = g.max > 0 ? Math.max(0, Math.min(1, g.value / g.max)) : 0;
        const fill = ratio * segment;
        return (
          <path
            key={g.subject}
            class="nq-charge-progress"
            data-charge-subject={g.subject}
            d={FRAME}
            pathLength={100}
            stroke-dasharray={`${fill} ${100 - fill}`}
            stroke-dashoffset={-index * segment}
          />
        );
      })}
    </svg>
  );
}
