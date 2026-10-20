import { render } from 'preact';
import type { LearningRewardReason } from '../core/progression/learningRewards';
import { t } from './i18n';
import { RubyLabel } from './RubyLabel';

export interface LearningRewardNotice {
  earned: number;
  reasons: LearningRewardReason[];
}

let clearTimer: number | undefined;

export function showLearningRewardNotice(layer: HTMLElement, reward: LearningRewardNotice): void {
  let host = layer.querySelector<HTMLElement>('.nq-learning-reward');
  if (!host) {
    host = document.createElement('aside');
    host.className = 'nq-win nq-learning-reward';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-atomic', 'true');
    layer.append(host);
  }
  const lines = [
    ...reward.reasons.map((reason) => t(`field.learningRewardReason.${reason}`)),
    t('field.learningRewardGained', { n: reward.earned }),
  ];
  render(<RubyLabel text={lines.join('\n')} as="p" />, host);
  window.clearTimeout(clearTimer);
  clearTimer = window.setTimeout(() => {
    render(null, host!);
    host?.remove();
  }, 4_000);
}
