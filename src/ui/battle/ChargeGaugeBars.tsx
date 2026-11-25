import { PixelIcon } from '../PixelIcon';
import type { SubjectGaugeView } from './store';

/** 高学年の教科ゲージ。枠の細分化を避け、同じ高さの縦棒で量を比べる。 */
export function ChargeGaugeBars({ gauges }: { gauges: SubjectGaugeView[] }) {
  return (
    <span class="nq-charge-bars" aria-hidden="true">
      {gauges.map((g) => {
        const ratio = g.max > 0 ? Math.max(0, Math.min(1, g.value / g.max)) : 0;
        return (
          <span class="nq-charge-bar-subject" key={g.subject}>
            <span class="nq-charge-bar" data-charge-bar={g.subject}>
              <i class={`nq-subj-${g.subject}`} style={{ height: `${ratio * 100}%` }} />
            </span>
            <PixelIcon name={`subj-${g.subject}`} scale={1} />
          </span>
        );
      })}
    </span>
  );
}
