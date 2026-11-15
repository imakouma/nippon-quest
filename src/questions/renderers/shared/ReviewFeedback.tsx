import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import type { Grade } from '../../contracts';
import { Feedback, type FeedbackKind } from './Feedback';

export function ReviewFeedback({
  kind,
  explanation,
  grade,
  onNext,
}: {
  kind: FeedbackKind;
  explanation?: string;
  grade: Grade;
  onNext: () => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const next = useRef<HTMLButtonElement>(null);
  const explanationText = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (showExplanation) explanationText.current?.focus();
    else next.current?.focus();
  }, [showExplanation]);
  return (
    <div class="nq-q nq-review">
      <section class="nq-review-panel" aria-labelledby="nq-review-title">
        <h2 id="nq-review-title" class="nq-review-title">
          けっか
        </h2>
        <Feedback kind={kind} />
        {explanation && showExplanation && (
          <p ref={explanationText} tabIndex={-1}>
            <RubyLabel text={explanation} grade={grade} />
          </p>
        )}
        <div class="nq-review-actions">
          {explanation && !showExplanation && (
            <button type="button" class="nq-btn nq-review-explain" onClick={() => setShowExplanation(true)}>
              {t('question.showExplanation')}
            </button>
          )}
          <button ref={next} type="button" class="nq-btn nq-review-next" onClick={onNext}>
            {t('question.next')}
          </button>
        </div>
      </section>
    </div>
  );
}
