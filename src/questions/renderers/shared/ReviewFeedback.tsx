import { useState } from 'preact/hooks';
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
  return (
    <div class="nq-q nq-review">
      <Feedback kind={kind} />
      {explanation && !showExplanation && (
        <button type="button" class="nq-btn nq-review-explain" onClick={() => setShowExplanation(true)}>
          {t('question.showExplanation')}
        </button>
      )}
      {explanation && showExplanation && <RubyLabel text={explanation} grade={grade} as="p" />}
      <button type="button" class="nq-btn nq-review-next" onClick={onNext}>
        {t('question.next')}
      </button>
    </div>
  );
}
