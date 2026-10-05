import { useEffect, useRef, useState } from 'preact/hooks';
import type { RendererContext } from '../../contracts';
import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import { stripRuby } from '../../../ui/ruby';
import { Feedback } from '../shared/Feedback';
import { TimerBar } from '../shared/TimerBar';
import { numberBuildScore, type NumberBuildPayload } from './schema';

interface Props {
  ctx: RendererContext;
  payload: NumberBuildPayload;
  onDone: (r: { score: number; timedOut: boolean; value: number }) => void;
}

export function NumberBuildView({ ctx, payload, onDone }: Props) {
  const initial = payload.mode === 'numberline' ? payload.min : 0;
  const [value, setValue] = useState(initial);
  const [digits, setDigits] = useState('');
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const doneRef = useRef(false);

  const current = payload.mode === 'keypad' ? Number(digits || '0') : value;
  const finish = (timedOut: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const nextScore = timedOut ? 0 : numberBuildScore(payload, current);
    setScore(nextScore);
    setDone(true);
    window.setTimeout(() => onDone({ score: nextScore, timedOut, value: current }), 1100);
  };

  const typeDigit = (digit: string) => {
    if (done || payload.mode !== 'keypad') return;
    if (digits.length < payload.maxDigits && !(digits === '0' && digit === '0'))
      setDigits(digits === '0' ? digit : digits + digit);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (done) return;
      if (payload.mode === 'keypad' && /^\d$/.test(event.key)) typeDigit(event.key);
      else if (payload.mode === 'keypad' && (event.key === 'Backspace' || event.key === 'Delete'))
        setDigits((text) => text.slice(0, -1));
      else if (event.key === 'Enter') finish(false);
      else if (payload.mode === 'numberline' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight'))
        setValue((n) =>
          Math.max(
            payload.min,
            Math.min(payload.max, n + (event.key === 'ArrowLeft' ? -payload.step : payload.step)),
          ),
        );
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const onAbort = () => finish(true);
    ctx.signal?.addEventListener('abort', onAbort);
    if (ctx.signal?.aborted) onAbort();
    return () => ctx.signal?.removeEventListener('abort', onAbort);
  });

  return (
    <div class="nq-q nq-q-number-build">
      <TimerBar ms={ctx.timeLimitMs} running={!done} onTimeout={() => finish(true)} />
      <div class="nq-q-prompt">
        <RubyLabel text={payload.prompt} grade={ctx.grade} as="p" />
        <button
          type="button"
          class="nq-btn nq-btn-speak"
          aria-label={t('question.speak')}
          onClick={() => ctx.speak(stripRuby(payload.prompt, 'kana'))}
        >
          🔊
        </button>
      </div>

      <output class="nq-nb-value" aria-live="polite">
        {current}
      </output>

      {payload.mode === 'blocks' && (
        <div class="nq-nb-blocks">
          {payload.blocks.map((block) => (
            <div class="nq-nb-block-row" key={block}>
              <button
                type="button"
                class="nq-btn nq-nb-minus"
                aria-label={t('question.numberBuildRemove', { n: block })}
                disabled={done || value - block < 0}
                onClick={() => setValue(Math.max(0, value - block))}
              >
                −
              </button>
              <button
                type="button"
                class={`nq-btn nq-nb-block nq-nb-block-${block}`}
                aria-label={t('question.numberBuildAdd', { n: block })}
                disabled={done || value + block > payload.max}
                onClick={() => setValue(value + block)}
              >
                +{block}
              </button>
            </div>
          ))}
        </div>
      )}

      {payload.mode === 'keypad' && (
        <div class="nq-nb-keypad">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'].map((digit) => (
            <button type="button" class="nq-btn" disabled={done} onClick={() => typeDigit(digit)}>
              {digit}
            </button>
          ))}
          <button type="button" class="nq-btn nq-nb-clear" disabled={done} onClick={() => setDigits('')}>
            {t('question.numberBuildClear')}
          </button>
        </div>
      )}

      {payload.mode === 'numberline' && (
        <div class="nq-nb-numberline">
          <input
            aria-label={t('question.numberBuildNumberline')}
            type="range"
            min={payload.min}
            max={payload.max}
            step={payload.step}
            value={value}
            disabled={done}
            onInput={(event) => setValue(Number((event.target as HTMLInputElement).value))}
          />
          <div class="nq-nb-labels">
            <span>{payload.labels?.[0] ?? payload.min}</span>
            <span>{payload.labels?.[1] ?? payload.max}</span>
          </div>
        </div>
      )}

      <button type="button" class="nq-btn nq-nb-submit" disabled={done} onClick={() => finish(false)}>
        {t('question.numberBuildAnswer')}
      </button>
      {done && <Feedback kind={score >= 1 ? 'correct' : score > 0 ? 'partial' : 'wrong'} />}
    </div>
  );
}
