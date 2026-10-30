import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../../ui/i18n';
import { RubyLabel } from '../../../ui/RubyLabel';
import type { QuestionRenderer, RendererContext } from '../../contracts';
import { Feedback } from '../shared/Feedback';
import { shuffleIds } from '../shared/shuffle';
import { TimerBar } from '../shared/TimerBar';
import { pairMatchPayloadSchema, pairMatchScore, type PairFace, type PairMatchPayload } from './schema';

const pairOf = (id: string) => id.slice(0, id.indexOf(':'));
const sideOf = (id: string) => id.slice(id.indexOf(':') + 1);

interface Done {
  score: number;
  timedOut: boolean;
  misses: number;
  attempts: number;
}

function Face({ face, ctx }: { face: PairFace; ctx: RendererContext }) {
  return (
    <>
      {face.image && <img src={ctx.assets.image(face.image)} alt="" />}
      {face.text && <RubyLabel text={face.text} grade={ctx.grade} />}
    </>
  );
}

function PairMatchView({
  payload,
  ctx,
  order,
  finish,
}: {
  payload: PairMatchPayload;
  ctx: RendererContext;
  order: string[];
  finish: (result: Done) => void;
}) {
  const [matched, setMatched] = useState<string[]>([]);
  const [open, setOpen] = useState<string[]>([]);
  const [missFlash, setMissFlash] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [round, setRound] = useState(0);
  const misses = useRef(0);
  const attempts = useRef(0);
  const ended = useRef(false);
  const settled = useRef(false);
  const timers = useRef(new Set<number>());

  const clearTimers = () => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current.clear();
  };
  const settle = (result: Done) => {
    if (settled.current) return;
    settled.current = true;
    clearTimers();
    finish(result);
  };
  const later = (callback: () => void, ms: number) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, ms);
    timers.current.add(timer);
  };
  const complete = (timedOut: boolean) => {
    if (ended.current) return;
    ended.current = true;
    const result = {
      score: timedOut ? 0 : pairMatchScore(misses.current, payload.pairs.length),
      timedOut,
      misses: misses.current,
      attempts: attempts.current,
    };
    setDone(result);
    later(() => settle(result), 900);
  };

  useEffect(() => {
    const abort = () => {
      ended.current = true;
      settle({ score: 0, timedOut: true, misses: misses.current, attempts: attempts.current });
    };
    ctx.signal?.addEventListener('abort', abort);
    if (ctx.signal?.aborted) abort();
    return () => {
      ctx.signal?.removeEventListener('abort', abort);
      clearTimers();
    };
  }, []);

  const pick = (id: string) => {
    if (ended.current || missFlash || matched.includes(id) || open.includes(id)) return;
    const first = open[0];
    if (first === undefined) {
      setOpen([id]);
      return;
    }
    if (!payload.faceDown && sideOf(first) === sideOf(id)) {
      setOpen([id]);
      return;
    }
    attempts.current += 1;
    ctx.onProgress?.({ attempts: attempts.current });
    if (pairOf(first) === pairOf(id) && sideOf(first) !== sideOf(id)) {
      const next = [...matched, first, id];
      setMatched(next);
      setOpen([]);
      if (next.length === order.length) complete(false);
      return;
    }
    misses.current += 1;
    setOpen([first, id]);
    setMissFlash(true);
    later(() => {
      setOpen([]);
      setMissFlash(false);
    }, 800);
  };

  const retry = () => {
    if (ended.current) return;
    clearTimers();
    misses.current = 0;
    attempts.current = 0;
    setMatched([]);
    setOpen([]);
    setMissFlash(false);
    setRound((value) => value + 1);
    ctx.onProgress?.({ attempts: 0 });
  };

  const card = (id: string) => {
    const pair = payload.pairs[Number(pairOf(id))]!;
    const face = sideOf(id) === 'a' ? pair.a : pair.b;
    const isMatched = matched.includes(id);
    const isOpen = open.includes(id);
    const shown = !payload.faceDown || isMatched || isOpen || done !== null;
    const state = isMatched ? 'matched' : isOpen ? (missFlash ? 'miss' : 'open') : '';
    return (
      <button
        type="button"
        key={id}
        class={`nq-pm-card ${state ? `nq-pm-${state}` : ''} ${shown ? '' : 'nq-pm-back'}`}
        disabled={done !== null || isMatched}
        aria-describedby="nq-question-prompt"
        aria-label={
          shown ? (face.text ? undefined : t('question.pairMatchCard')) : t('question.pairMatchBack')
        }
        aria-pressed={isMatched || isOpen}
        onClick={() => pick(id)}
      >
        {shown ? <Face face={face} ctx={ctx} /> : '？'}
      </button>
    );
  };

  return (
    <div class="nq-q nq-q-pair-match">
      <TimerBar key={round} ms={ctx.timeLimitMs} running={done === null} onTimeout={() => complete(true)} />
      <div class="nq-pm-prompt">
        <RubyLabel
          id="nq-question-prompt"
          class="nq-q-prompt"
          text={payload.prompt}
          grade={ctx.grade}
          as="p"
        />
        <button type="button" class="nq-btn nq-pm-retry" disabled={done !== null} onClick={retry}>
          {t('question.pairMatchRetry')}
        </button>
      </div>
      {payload.faceDown ? (
        <div
          class={`nq-pm-grid nq-pm-grid-${order.length}`}
          role="group"
          aria-labelledby="nq-question-prompt"
        >
          {order.map(card)}
        </div>
      ) : (
        <div class="nq-pm-columns" role="group" aria-labelledby="nq-question-prompt">
          <div class="nq-pm-column">{order.filter((id) => sideOf(id) === 'a').map(card)}</div>
          <div class="nq-pm-column">{order.filter((id) => sideOf(id) === 'b').map(card)}</div>
        </div>
      )}
      {done && (
        <Feedback
          kind={
            done.timedOut ? 'timeout' : done.score >= 1 ? 'correct' : done.score > 0 ? 'partial' : 'wrong'
          }
        />
      )}
    </div>
  );
}

export const pairMatchRenderer: QuestionRenderer = {
  type: 'pair-match',
  schema: pairMatchPayloadSchema,
  mount(ctx) {
    const payload = pairMatchPayloadSchema.parse(ctx.question.payload);
    const ids = payload.pairs.flatMap((_, index) => [`${index}:a`, `${index}:b`]);
    const order = shuffleIds(ids, `${ctx.question.id}:${Date.now()}`);
    const started = performance.now();
    return new Promise((resolve) =>
      render(
        <PairMatchView
          payload={payload}
          ctx={ctx}
          order={order}
          finish={({ score, timedOut, misses, attempts }) => {
            render(null, ctx.container);
            resolve({
              questionId: ctx.question.id,
              score,
              timedOut,
              attempts,
              timeMs: Math.round(performance.now() - started),
              detail: { misses, order },
            });
          }}
        />,
        ctx.container,
      ),
    );
  },
};
