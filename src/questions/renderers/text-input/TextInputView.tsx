import { useEffect, useRef, useState } from 'preact/hooks';
import type { RendererContext } from '../../contracts';
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
  const finish = (timedOut: boolean) => {
    if (once.current) return;
    once.current = true;
    setDone(true);
    setTimeout(
      () => onDone({ score: timedOut ? 0 : textInputScore(payload, values), values, timedOut }),
      900,
    );
  };
  useEffect(() => {
    const abort = () => finish(true);
    ctx.signal?.addEventListener('abort', abort);
    if (ctx.signal?.aborted) abort();
    return () => ctx.signal?.removeEventListener('abort', abort);
  });
  const pieces = (payload.template ?? '{{INPUT}}').split('{{INPUT}}');
  return (
    <div class="nq-q nq-q-input">
      <TimerBar ms={ctx.timeLimitMs} running={!done} onTimeout={() => finish(true)} />
      <div class="nq-q-prompt">
        {payload.promptImage && (
          <img class="nq-q-prompt-img" src={ctx.assets.image(payload.promptImage)} alt="" />
        )}
        <RubyLabel text={payload.prompt} grade={ctx.grade} as="p" />
      </div>
      <div class="nq-input-template">
        {pieces.map((piece, index) => (
          <span key={index}>
            <RubyLabel text={piece} grade={ctx.grade} />
            {index < payload.answers.length && (
              <input
                aria-label={`こたえ ${index + 1}`}
                value={values[index]}
                disabled={done}
                inputMode="decimal"
                onInput={(event) => {
                  const next = [...values];
                  next[index] = (event.currentTarget as HTMLInputElement).value;
                  setValues(next);
                }}
              />
            )}
          </span>
        ))}
      </div>
      {payload.suffix && <RubyLabel text={payload.suffix} class="nq-input-suffix" />}
      <button
        type="button"
        class="nq-btn nq-input-submit"
        disabled={done || values.some((v) => !v.trim())}
        onClick={() => finish(false)}
      >
        こたえる
      </button>
      {done && <Feedback kind={textInputScore(payload, values) === 1 ? 'correct' : 'wrong'} />}
    </div>
  );
}
