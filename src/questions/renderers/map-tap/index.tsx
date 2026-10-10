import { h, render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { QuestionRenderer, RendererContext } from '../../contracts';
import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import { stripRuby } from '../../../ui/ruby';
import { Feedback } from '../shared/Feedback';
import { TimerBar } from '../shared/TimerBar';
import { mapTapPayloadSchema, mapTapScore, type MapTapPayload } from './schema';
function View({
  ctx,
  p,
  onDone,
}: {
  ctx: RendererContext;
  p: MapTapPayload;
  onDone: (x: number, y: number, t: boolean) => void;
}) {
  const [pick, setPick] = useState<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const once = useRef(false);
  const timer = useRef<number | null>(null);
  const finish = (x: number, y: number, t = false) => {
    if (once.current) return;
    once.current = true;
    setPick({ x, y });
    timer.current = window.setTimeout(() => {
      timer.current = null;
      onDone(x, y, t);
    }, 900);
  };
  useEffect(() => {
    const abort = () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      else if (once.current) return;
      once.current = true;
      timer.current = null;
      onDone(-100, -100, true);
    };
    ctx.signal?.addEventListener('abort', abort);
    if (ctx.signal?.aborted) abort();
    return () => {
      ctx.signal?.removeEventListener('abort', abort);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);
  const cursorPosition = t('question.mapTapPosition', {
    x: Math.round(cursor.x),
    y: Math.round(cursor.y),
  });
  return (
    <div class="nq-q">
      <TimerBar ms={ctx.timeLimitMs} running={!pick} onTimeout={() => finish(-100, -100, true)} />
      <div id="nq-question-prompt" class="nq-q-prompt">
        <RubyLabel text={p.prompt} grade={ctx.grade} as="p" />
      </div>
      <button
        class="nq-map-tap"
        aria-label={`${stripRuby(p.prompt, 'kana')} ${t('question.mapTapMap')}`}
        aria-describedby="nq-question-prompt nq-map-tap-instruction nq-map-tap-position"
        disabled={!!pick}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const next = {
            x: ((e.clientX - r.left) / r.width) * 100,
            y: ((e.clientY - r.top) / r.height) * 100,
          };
          setCursor(next);
          finish(next.x, next.y);
        }}
        onKeyDown={(event) => {
          if (pick) return;
          const delta =
            event.key === 'ArrowLeft'
              ? [-5, 0]
              : event.key === 'ArrowRight'
                ? [5, 0]
                : event.key === 'ArrowUp'
                  ? [0, -5]
                  : event.key === 'ArrowDown'
                    ? [0, 5]
                    : null;
          if (delta) {
            event.preventDefault();
            setCursor((current) => ({
              x: Math.max(0, Math.min(100, current.x + delta[0]!)),
              y: Math.max(0, Math.min(100, current.y + delta[1]!)),
            }));
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            finish(cursor.x, cursor.y);
          }
        }}
      >
        <img src={ctx.assets.image(p.image)} alt="" />
        {!pick && (
          <span
            class="nq-map-cursor"
            aria-hidden="true"
            style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
          />
        )}
        {pick && (
          <span class="nq-map-pick" aria-hidden="true" style={{ left: `${pick.x}%`, top: `${pick.y}%` }} />
        )}
      </button>
      <span id="nq-map-tap-instruction" class="nq-visually-hidden">
        {t('question.mapTapInstruction')}
      </span>
      <span
        id="nq-map-tap-position"
        class="nq-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {cursorPosition}
      </span>
      {pick && <Feedback kind={mapTapScore(p, pick.x, pick.y) === 1 ? 'correct' : 'wrong'} />}
    </div>
  );
}
export const mapTapRenderer: QuestionRenderer = {
  type: 'map-tap',
  schema: mapTapPayloadSchema,
  mount(ctx) {
    const p = mapTapPayloadSchema.parse(ctx.question.payload);
    const start = performance.now();
    return new Promise((resolve) =>
      render(
        h(View, {
          ctx,
          p,
          onDone: (x, y, t) => {
            render(null, ctx.container);
            resolve({
              questionId: ctx.question.id,
              score: t ? 0 : mapTapScore(p, x, y),
              timeMs: Math.round(performance.now() - start),
              attempts: t ? 0 : 1,
              timedOut: t,
              detail: { x, y },
            });
          },
        }),
        ctx.container,
      ),
    );
  },
};
