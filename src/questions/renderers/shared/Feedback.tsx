/** 正誤演出。赤い×は使わない。不正解は「おしい！」（GDD §8） */
export type FeedbackKind = 'correct' | 'partial' | 'wrong' | 'timeout';

const TEXT: Record<FeedbackKind, string> = {
  correct: 'かんぺき！',
  partial: 'おしい！',
  wrong: 'おしい！',
  timeout: 'じかんぎれ',
};

export function Feedback({ kind }: { kind: FeedbackKind }) {
  return (
    <div class={`nq-feedback nq-feedback-${kind}`} role="status" aria-live="polite" aria-atomic="true">
      <span class="nq-feedback-text">{TEXT[kind]}</span>
    </div>
  );
}
