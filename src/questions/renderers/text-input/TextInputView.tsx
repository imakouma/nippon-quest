import { useEffect, useRef, useState } from 'preact/hooks';
import type { RendererContext } from '../../contracts';
import { t } from '../../../ui/i18n';
import { stripRuby } from '../../../ui/ruby';
import { RubyLabel } from '../../../ui/RubyLabel';
import { Feedback } from '../shared/Feedback';
import { ReviewFeedback } from '../shared/ReviewFeedback';
import { TimerBar } from '../shared/TimerBar';
import { getTextInputSpeech } from '../shared/questionSpeech';
import { normalizeInput, textInputScore, type TextInputPayload } from './schema';

export function shouldShowNumberPad(answers: string[]): boolean {
  return answers.every((answer) => /^-?(?:\d+|\d*\.\d+)$/.test(normalizeInput(answer)));
}

export function TextInputView({
  ctx,
  payload,
  onDone,
}: {
  ctx: RendererContext;
  payload: TextInputPayload;
  onDone: (r: { score: number; values: string[]; timedOut: boolean; answeredAt?: number }) => void;
}) {
  const [values, setValues] = useState(() => payload.answers.map(() => ''));
  const [activeInput, setActiveInput] = useState(0);
  const [done, setDone] = useState(false);
  const once = useRef(false);
  const completionTimer = useRef<number | null>(null);
  const completed = useRef(false);
  const answer = useRef<{ score: number; values: string[]; timedOut: boolean; answeredAt?: number } | null>(
    null,
  );
  const review = ctx.question.subject === 'sansu' && ctx.question.grade <= 3;
  const numberPad = shouldShowNumberPad(payload.answers);
  const decimalKey = payload.answers.some((value) => normalizeInput(value).includes('.'));
  const negativeKey = payload.answers.some((value) => normalizeInput(value).startsWith('-'));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const typeOnPad = (key: string) => {
    setValues((current) => {
      const next = [...current];
      const value = next[activeInput] ?? '';
      if (key === 'clear') next[activeInput] = '';
      else if (key === '.' && value.includes('.')) return current;
      else if (key === '-') next[activeInput] = value.startsWith('-') ? value.slice(1) : `-${value}`;
      else next[activeInput] = value + key;
      return next;
    });
    inputs.current[activeInput]?.focus();
  };
  const finish = (timedOut: boolean) => {
    if (once.current) return;
    once.current = true;
    setDone(true);
    answer.current = {
      score: timedOut ? 0 : textInputScore(payload, values),
      values,
      timedOut,
      ...(review ? { answeredAt: performance.now() } : {}),
    };
    if (!review)
      completionTimer.current = window.setTimeout(() => {
        completionTimer.current = null;
        completed.current = true;
        onDone(answer.current!);
      }, 900);
  };
  const cancel = () => {
    if (completed.current) return;
    if (completionTimer.current !== null) window.clearTimeout(completionTimer.current);
    completed.current = true;
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
  const compact = (value: string) => stripRuby(value).replaceAll('{{INPUT}}', '').replace(/\s+/g, '');
  const promptRepeated =
    !!payload.template && !payload.promptImage && compact(template) === compact(payload.prompt);
  const promptId = promptRepeated ? 'nq-question-template' : 'nq-question-prompt';
  const suffixRepeated = !!payload.suffix && template.trimEnd().endsWith(payload.suffix);
  if (review && done)
    return (
      <ReviewFeedback
        kind={answer.current?.timedOut ? 'timeout' : answer.current?.score === 1 ? 'correct' : 'wrong'}
        explanation={ctx.question.explanation}
        grade={ctx.grade}
        onNext={() => {
          if (completed.current) return;
          completed.current = true;
          onDone(answer.current!);
        }}
      />
    );
  return (
    <div class="nq-q nq-q-input">
      <TimerBar ms={ctx.timeLimitMs} running={!done} onTimeout={() => finish(true)} />
      <button
        type="button"
        class="nq-btn nq-btn-speak nq-input-speak"
        aria-label={t('question.speak')}
        onClick={() => ctx.speak(getTextInputSpeech(payload, ctx.question.subject === 'sansu'))}
      >
        🔊
      </button>
      {!promptRepeated && (
        <div
          id="nq-question-prompt"
          class={payload.promptImageAlt ? 'nq-q-prompt nq-input-illustrated-prompt' : 'nq-q-prompt'}
        >
          {payload.promptImage && !payload.promptImageAlt && (
            <img class="nq-q-prompt-img" src={ctx.assets.image(payload.promptImage)} alt="" />
          )}
          <RubyLabel text={payload.prompt} grade={ctx.grade} as="p" />
          {payload.promptImage && payload.promptImageAlt && (
            <div class="nq-input-illustration" tabIndex={0}>
              <img src={ctx.assets.image(payload.promptImage)} alt={payload.promptImageAlt} />
            </div>
          )}
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
                class={numberPad && activeInput === index ? 'nq-input-active' : undefined}
                value={values[index]}
                disabled={done}
                inputMode="decimal"
                onFocus={() => setActiveInput(index)}
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
      {numberPad ? (
        <div class="nq-input-number-pad" role="group" aria-label={t('question.textInputNumberPad')}>
          {['1', '2', '3'].map((digit) => (
            <button key={digit} type="button" class="nq-btn" disabled={done} onClick={() => typeOnPad(digit)}>
              {digit}
            </button>
          ))}
          <span class="nq-input-pad-spacer" aria-hidden="true" />
          {['4', '5', '6'].map((digit) => (
            <button key={digit} type="button" class="nq-btn" disabled={done} onClick={() => typeOnPad(digit)}>
              {digit}
            </button>
          ))}
          <button
            type="button"
            class="nq-btn nq-input-pad-action"
            aria-label={t('question.textInputClear')}
            disabled={done}
            onClick={() => typeOnPad('clear')}
          >
            ❌
          </button>
          {['7', '8', '9', '0'].map((digit) => (
            <button key={digit} type="button" class="nq-btn" disabled={done} onClick={() => typeOnPad(digit)}>
              {digit}
            </button>
          ))}
          {decimalKey && (
            <button type="button" class="nq-btn" disabled={done} onClick={() => typeOnPad('.')}>
              .
            </button>
          )}
          {negativeKey && (
            <button type="button" class="nq-btn" disabled={done} onClick={() => typeOnPad('-')}>
              −
            </button>
          )}
        </div>
      ) : (
        <p class="nq-input-key-hint">
          <kbd>Enter</kbd> {t('question.textInputEnterHint')}
        </p>
      )}
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
