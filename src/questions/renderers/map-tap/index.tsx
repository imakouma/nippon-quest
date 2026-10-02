import { h, render } from 'preact';
import { useRef, useState } from 'preact/hooks';
import type { QuestionRenderer, RendererContext } from '../../contracts';
import { RubyLabel } from '../../../ui/RubyLabel';
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
  const once = useRef(false);
  const finish = (x: number, y: number, t = false) => {
    if (once.current) return;
    once.current = true;
    setPick({ x, y });
    setTimeout(() => onDone(x, y, t), 900);
  };
  return (
    <div class="nq-q">
      <TimerBar ms={ctx.timeLimitMs} running={!pick} onTimeout={() => finish(-100, -100, true)} />
      <div class="nq-q-prompt">
        <RubyLabel text={p.prompt} grade={ctx.grade} as="p" />
      </div>
      <button
        class="nq-map-tap"
        disabled={!!pick}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          finish(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
        }}
      >
        <img src={ctx.assets.image(p.image)} alt="問題の地図" />
        {pick && (
          <span class="nq-map-pick" style={{ left: `${pick.x}%`, top: `${pick.y}%` }}>
            ×
          </span>
        )}
      </button>
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
