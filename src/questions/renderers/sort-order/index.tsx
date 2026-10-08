import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import { displayText } from '../../../ui/ruby';
import type { QuestionRenderer } from '../../contracts';
import { Feedback } from '../shared/Feedback';
import { TimerBar } from '../shared/TimerBar';
import { sortOrderPayloadSchema, sortOrderScore, type SortOrderPayload } from './schema';

function View({
  payload,
  ctx,
  finish,
}: {
  payload: SortOrderPayload;
  ctx: Parameters<QuestionRenderer['mount']>[0];
  finish: (score: number, timedOut: boolean, order: string[]) => void;
}) {
  const [order, setOrder] = useState(() => payload.cards.map(({ id }) => id));
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const ended = useRef(false);
  const timer = useRef<number | null>(null);
  const complete = (timedOut: boolean) => {
    if (ended.current) return;
    ended.current = true;
    const next = timedOut ? 0 : sortOrderScore(order, payload.answer);
    setScore(next);
    setDone(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      finish(next, timedOut, order);
    }, 900);
  };
  useEffect(() => {
    const abort = () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      else if (ended.current) return;
      ended.current = true;
      timer.current = null;
      finish(0, true, order);
    };
    ctx.signal?.addEventListener('abort', abort);
    if (ctx.signal?.aborted) abort();
    return () => {
      ctx.signal?.removeEventListener('abort', abort);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (done || target < 0 || target >= order.length) return;
    const next = [...order];
    const current = next[index]!;
    next[index] = next[target]!;
    next[target] = current;
    setOrder(next);
  };
  return (
    <div class="nq-q nq-q-sort-order">
      <TimerBar ms={ctx.timeLimitMs} running={!done} onTimeout={() => complete(true)} />
      <RubyLabel id="nq-question-prompt" class="nq-q-prompt" text={payload.prompt} grade={ctx.grade} as="p" />
      <div
        class={`nq-sort-cards nq-sort-${payload.direction}`}
        role="list"
        aria-describedby="nq-question-prompt"
      >
        {order.map((id, index) => {
          const card = payload.cards.find((item) => item.id === id)!;
          return (
            <div
              class="nq-sort-card"
              key={id}
              role="listitem"
              aria-posinset={index + 1}
              aria-setsize={order.length}
            >
              {card.image && <img src={ctx.assets.image(card.image)} alt="" />}
              <RubyLabel text={card.text} grade={ctx.grade} />
              <span>
                <button
                  type="button"
                  class="nq-btn"
                  aria-label={t('question.sortMoveEarlier', { name: displayText(card.text) })}
                  disabled={done || index === 0}
                  onClick={() => move(index, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  class="nq-btn"
                  aria-label={t('question.sortMoveLater', { name: displayText(card.text) })}
                  disabled={done || index === order.length - 1}
                  onClick={() => move(index, 1)}
                >
                  →
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <button type="button" class="nq-btn nq-sort-submit" disabled={done} onClick={() => complete(false)}>
        こたえる
      </button>
      {done && <Feedback kind={score >= 1 ? 'correct' : score > 0 ? 'partial' : 'wrong'} />}
    </div>
  );
}

export const sortOrderRenderer: QuestionRenderer = {
  type: 'sort-order',
  schema: sortOrderPayloadSchema,
  mount(ctx) {
    const payload = sortOrderPayloadSchema.parse(ctx.question.payload);
    const started = performance.now();
    return new Promise((resolve) =>
      render(
        <View
          payload={payload}
          ctx={ctx}
          finish={(score, timedOut, order) => {
            render(null, ctx.container);
            resolve({
              questionId: ctx.question.id,
              score,
              timedOut,
              attempts: timedOut ? 0 : 1,
              timeMs: Math.round(performance.now() - started),
              detail: { order },
            });
          }}
        />,
        ctx.container,
      ),
    );
  },
};
