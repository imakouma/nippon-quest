import { useEffect, useRef, useState } from 'preact/hooks';
import type { RendererContext } from '../../contracts';
import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import { Feedback } from '../shared/Feedback';
import { TimerBar } from '../shared/TimerBar';
import { textInputScore, type TextInputPayload } from './schema';

export function TextInputView({
  ctx,
  payload,
  onDone,
}: {
  ctx: RendererContext;
  payload: TextInputPayload;
  onDone: (r: { score: number; values: string[]; timedOut: boolean }) => void;
}) {
  const [values, setValues] = useState(() => payload.answers.map(() => ''));
  const [done, setDone] = useState(false);
  const once = useRef(false);
  const completionTimer = useRef<number | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const finish = (timedOut: boolean) => {
    if (once.current) return;
    once.current = true;
    setDone(true);
    completionTimer.current = window.setTimeout(() => {
      completionTimer.current = null;
      onDone({ score: timedOut ? 0 : textInputScore(payload, values), values, timedOut });
    }, 900);
  };
  const cancel = () => {
    if (completionTimer.current !== null) window.clearTimeout(completionTimer.current);
    else if (once.current) return;
    once.current = true;
    completionTimer.current = null;
    onDone({ score: 0, values, timedOut: true });
  };
  useEffect(() => {
    const abort = () => cancel();
    ctx.signal?.addEventListener('abort', abort);
    if (ctx.signal?.aborted) abort();
    return () => ctx.signal?.removeEventListener('abort', abort);
  });
  const template = payload.template ?? '{{INPUT}}';
  const pieces = template.split('{{INPUT}}');
  const compact = (value: string) => value.replaceAll('{{INPUT}}', '').replace(/\s+/g, '');
  const promptRepeated =
    !!payload.template && !payload.promptImage && compact(template) === compact(payload.prompt);
  const promptId = promptRepeated ? 'nq-question-template' : 'nq-question-prompt';
  const suffixRepeated = !!payload.suffix && template.trimEnd().endsWith(payload.suffix);
  return (
    <div class="nq-q nq-q-input">
      <TimerBar ms={ctx.timeLimitMs} running={!done} onTimeout={() => finish(true)} />
      {!promptRepeated && (
        <div id="nq-question-prompt" class="nq-q-prompt">
          {payload.promptImage && (
            <img class="nq-q-prompt-img" src={ctx.assets.image(payload.promptImage)} alt="" />
          )}
          <RubyLabel text={payload.prompt} grade={ctx.grade} as="p" />
        </div>
      )}
      <div id={promptRepeated ? 'nq-question-template' : undefined} class="nq-input-template">
        {pieces.map((piece, index) => (
          <span key={index}>
            <RubyLabel text={piece} grade={ctx.grade} />
            {index < payload.answers.length && (
              <input
                ref={(input) => {
                  inputs.current[index] = input;
                }}
                aria-label={t('question.answerNumber', { n: index + 1 })}
                aria-describedby={promptId}
                aria-keyshortcuts="Enter"
                value={values[index]}
                disabled={done}
                inputMode="decimal"
                onInput={(event) => {
                  const next = [...values];
                  next[index] = (event.currentTarget as HTMLInputElement).value;
                  setValues(next);
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  const nextEmpty = values.findIndex((value) => !value.trim());
                  if (nextEmpty >= 0) {
                    if (nextEmpty !== index) {
                      event.preventDefault();
                      inputs.current[nextEmpty]?.focus();
                    }
                    return;
                  }
                  event.preventDefault();
                  finish(false);
                }}
              />
            )}
          </span>
        ))}
      </div>
      {payload.suffix && !suffixRepeated && <RubyLabel text={payload.suffix} class="nq-input-suffix" />}
      <p class="nq-input-key-hint">
        <kbd>Enter</kbd> {t('question.textInputEnterHint')}
      </p>
      <button
        type="button"
        class="nq-btn nq-input-submit"
        disabled={done || values.some((v) => !v.trim())}
        aria-keyshortcuts="Enter"
        onClick={() => finish(false)}
      >
        {t('question.answerSubmit')}
      </button>
      {done && <Feedback kind={textInputScore(payload, values) === 1 ? 'correct' : 'wrong'} />}
    </div>
  );
}
