import { useEffect, useRef, useState } from 'preact/hooks';

import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import type { RendererContext } from '../../contracts';
import { Feedback, type FeedbackKind } from '../shared/Feedback';
import { TimerBar } from '../shared/TimerBar';
import type { KanjiTracePayload } from './schema';
import { TraceCanvas } from './TraceCanvas';

export interface KanjiTraceDone {
  score: number;
  timedOut: boolean;
  attempts: number;
  match?: number;
  chosen?: string | null;
}

interface Props {
  payload: KanjiTracePayload;
  ctx: RendererContext;
  order: string[];
  onDone: (result: KanjiTraceDone) => void;
}

export function KanjiTraceView({ payload, ctx, order, onDone }: Props) {
  const [result, setResult] = useState<KanjiTraceDone | null>(null);
  const ended = useRef(false);
  const completionTimer = useRef<number | null>(null);

  const complete = (next: Omit<KanjiTraceDone, 'timedOut'>, timedOut = false) => {
    if (ended.current) return;
    ended.current = true;
    const finished = { ...next, score: timedOut ? 0 : next.score, timedOut };
    setResult(finished);
    completionTimer.current = window.setTimeout(() => {
      completionTimer.current = null;
      onDone(finished);
    }, 900);
  };

  const cancel = () => {
    if (completionTimer.current !== null) window.clearTimeout(completionTimer.current);
    else if (ended.current) return;
    ended.current = true;
    completionTimer.current = null;
    onDone({ score: 0, timedOut: true, attempts: 0 });
  };

  useEffect(() => {
    const onAbort = () => cancel();
    ctx.signal?.addEventListener('abort', onAbort);
    if (ctx.signal?.aborted) onAbort();
    return () => {
      ctx.signal?.removeEventListener('abort', onAbort);
      if (completionTimer.current !== null) window.clearTimeout(completionTimer.current);
    };
  }, [ctx.signal]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (payload.mode !== 'reading' || result) return;
      const choice = order[Number(event.key) - 1];
      if (choice) complete({ score: choice === payload.answer ? 1 : 0, attempts: 1, chosen: choice });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const reading = payload.mode === 'reading';
  const feedback: FeedbackKind = result?.timedOut
    ? 'timeout'
    : (result?.score ?? 0) >= 1
      ? 'correct'
      : (result?.score ?? 0) > 0
        ? 'partial'
        : 'wrong';

  return (
    <div class={`nq-q nq-q-kanji-trace nq-kt-${payload.mode}`}>
      <TimerBar
        ms={ctx.timeLimitMs}
        running={!result}
        onTimeout={() => complete({ score: 0, attempts: 0, chosen: null }, true)}
      />
      <div id="nq-question-prompt" class="nq-q-prompt">
        <p>
          <RubyLabel
            text={t(reading ? 'question.kanjiTraceReadingPrompt' : 'question.kanjiTracePrompt')}
            grade={ctx.grade}
          />
          {!reading && payload.strokeCount && (
            <span class="nq-kt-strokes">{t('question.kanjiTraceStrokes', { n: payload.strokeCount })}</span>
          )}
        </p>
        <button
          type="button"
          class="nq-btn nq-btn-speak"
          aria-label={t('question.speak')}
          onClick={() => ctx.speak(payload.reading)}
        >
          🔊
        </button>
      </div>
      {reading && <div class="nq-kt-big">{payload.kanji}</div>}
      {payload.hintWord && !reading && (
        <RubyLabel class="nq-kt-hint" text={payload.hintWord} grade={ctx.grade} as="p" />
      )}
      {reading ? (
        <div class={`nq-q-choices nq-q-choices-${order.length}`}>
          {order.map((choice, index) => {
            const state = result
              ? choice === payload.answer
                ? 'correct'
                : choice === result.chosen
                  ? 'chosen'
                  : 'dim'
              : 'idle';
            return (
              <button
                key={choice}
                type="button"
                class={`nq-btn nq-choice nq-choice-${state}`}
                aria-keyshortcuts={String(index + 1)}
                aria-describedby="nq-question-prompt"
                disabled={!!result}
                onClick={() =>
                  complete({ score: choice === payload.answer ? 1 : 0, attempts: 1, chosen: choice })
                }
              >
                <span class="nq-choice-key">{index + 1}</span>
                <RubyLabel class="nq-choice-content" text={choice} grade={ctx.grade} />
              </button>
            );
          })}
        </div>
      ) : (
        <TraceCanvas
          payload={payload}
          ctx={ctx}
          disabled={!!result}
          onSubmit={(score, match) => complete({ score, match, attempts: 1 })}
        />
      )}
      {result && <Feedback kind={feedback} />}
    </div>
  );
}
