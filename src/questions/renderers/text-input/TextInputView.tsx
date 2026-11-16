import { useEffect, useRef, useState } from 'preact/hooks';
import type { RendererContext } from '../../contracts';
import { t } from '../../../ui/i18n';
import { stripRuby } from '../../../ui/ruby';
import { RubyLabel } from '../../../ui/RubyLabel';
import { ReviewFeedback } from '../shared/ReviewFeedback';
import { TimerBar } from '../shared/TimerBar';
import { getTextInputSpeech } from '../shared/questionSpeech';
import { normalizeInput, textInputScore, type TextInputPayload } from './schema';
import { ReadingPrompt } from './ReadingPrompt';

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
  const [composingIndex, setComposingIndex] = useState<number | null>(null);
  const once = useRef(false);
  const completed = useRef(false);
  const answer = useRef<{ score: number; values: string[]; timedOut: boolean; answeredAt?: number } | null>(
    null,
  );
  const numberPad = shouldShowNumberPad(payload.answers);
  const decimalKey = payload.answers.some((value) => normalizeInput(value).includes('.'));
  const negativeKey = payload.answers.some((value) => normalizeInput(value).startsWith('-'));
  const reading = ctx.question.tags?.some((tag) => tag.startsWith('kanji:reading:')) ?? false;
  const invalid = values.map(
    (value, index) =>
      reading && composingIndex !== index && value !== '' && !/^[ぁ-ゖー]+$/u.test(value.normalize('NFC')),
  );
  const invalidIndex = invalid.indexOf(true);
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
    if (!timedOut && (invalidIndex >= 0 || composingIndex !== null)) {
      inputs.current[invalidIndex >= 0 ? invalidIndex : composingIndex!]?.focus();
      return;
    }
    once.current = true;
    setDone(true);
    answer.current = {
      score: timedOut ? 0 : textInputScore(payload, values),
      values,
      timedOut,
      answeredAt: performance.now(),
    };
  };
  const cancel = () => {
    if (completed.current) return;
    completed.current = true;
    once.current = true;
    onDone({ score: 0, values, timedOut: true });
  };
  useEffect(() => {
    const abort = () => cancel();
    ctx.signal?.addEventListener('abort', abort);
    if (ctx.signal?.aborted) abort();
    return () => ctx.signal?.removeEventListener('abort', abort);
  });
  const template = (payload.template ?? '{{INPUT}}').replace(/[□▢]/g, '{{INPUT}}');
  const pieces = template.split('{{INPUT}}');
  const compact = (value: string) => stripRuby(value).replaceAll('{{INPUT}}', '').replace(/\s+/g, '');
  const promptRepeated =
    !!payload.template && !payload.promptImage && compact(template) === compact(payload.prompt);
  const promptId = promptRepeated ? 'nq-question-template' : 'nq-question-prompt';
  const suffixRepeated = !!payload.suffix && template.trimEnd().endsWith(payload.suffix);
  // shortcut: 32文字を超える単一回答は独立行にする。複数欄の長文が必要になったらレイアウトモデルへ分ける。
  const answerOnOwnRow = payload.answers.length === 1 && compact(pieces[0] ?? '').length > 32;
  const inputAt = (index: number) => (
    <input
      ref={(input) => {
        inputs.current[index] = input;
      }}
      aria-label={t('question.answerNumber', { n: index + 1 })}
      aria-describedby={`${promptId}${invalid[index] ? ' nq-reading-error' : ''}`}
      aria-invalid={invalid[index] || undefined}
      aria-keyshortcuts="Enter"
      class={numberPad && activeInput === index ? 'nq-input-active' : undefined}
      value={values[index]}
      disabled={done}
      inputMode={numberPad ? 'decimal' : 'text'}
      style={
        reading ? { width: `${Math.max(4, Math.min(12, (values[index]?.length ?? 0) + 1))}em` } : undefined
      }
      onFocus={() => setActiveInput(index)}
      // Preactの独自イベント判定を避け、ブラウザの小文字イベント名を使う。
      {...{
        oncompositionstart: () => setComposingIndex(index),
        oncompositionend: () => setComposingIndex(null),
      }}
      onInput={(event) => {
        const next = [...values];
        next[index] = (event.currentTarget as HTMLInputElement).value;
        setValues(next);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229) return;
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
  );
  if (done)
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
    <div class={`nq-q nq-q-input${reading ? ' nq-q-reading' : ''}`}>
      <TimerBar ms={ctx.timeLimitMs} running={!done} onTimeout={() => finish(true)} />
      {!reading && (
        <button
          type="button"
          class="nq-btn nq-btn-speak nq-input-speak"
          aria-label={t('question.speak')}
          onClick={() => ctx.speak(getTextInputSpeech(payload, ctx.question.subject === 'sansu'))}
        >
          🔊
        </button>
      )}
      {!promptRepeated && (
        <div
          id="nq-question-prompt"
          class={payload.promptImageAlt ? 'nq-q-prompt nq-input-illustrated-prompt' : 'nq-q-prompt'}
        >
          {payload.promptImage && !payload.promptImageAlt && (
            <img class="nq-q-prompt-img" src={ctx.assets.image(payload.promptImage)} alt="" />
          )}
          {reading ? (
            <ReadingPrompt text={payload.prompt} grade={ctx.grade} />
          ) : (
            <RubyLabel text={payload.prompt} grade={ctx.grade} as="p" />
          )}
          {payload.promptImage && payload.promptImageAlt && (
            <div class="nq-input-illustration" tabIndex={0}>
              <img src={ctx.assets.image(payload.promptImage)} alt={payload.promptImageAlt} />
            </div>
          )}
        </div>
      )}
      <div
        id={promptRepeated ? 'nq-question-template' : undefined}
        class={`nq-input-template${answerOnOwnRow ? ' nq-input-template-stacked' : ''}`}
      >
        {answerOnOwnRow ? (
          <>
            <RubyLabel text={pieces[0] ?? ''} grade={ctx.grade} class="nq-input-question-text" />
            <span class="nq-input-answer-row">
              {inputAt(0)}
              <RubyLabel text={pieces[1] ?? ''} grade={ctx.grade} />
            </span>
          </>
        ) : (
          pieces.map((piece, index) => (
            <span key={index}>
              <RubyLabel text={piece} grade={ctx.grade} />
              {index < payload.answers.length && inputAt(index)}
            </span>
          ))
        )}
      </div>
      {payload.suffix && !suffixRepeated && <RubyLabel text={payload.suffix} class="nq-input-suffix" />}
      {numberPad && (
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
      )}
      {reading && (
        <div id="nq-reading-error" class="nq-reading-error" role="alert" aria-atomic="true">
          {invalidIndex >= 0 && !done ? t('question.hiraganaOnly') : ''}
        </div>
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
    </div>
  );
}
