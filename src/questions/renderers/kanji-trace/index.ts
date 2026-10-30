import { h, render } from 'preact';

import type { QuestionRenderer, QuestionResult, RendererContext } from '../../contracts';
import { shuffleIds } from '../shared/shuffle';
import { KanjiTraceView } from './KanjiTraceView';
import { kanjiTracePayloadSchema } from './schema';

export const kanjiTraceRenderer: QuestionRenderer = {
  type: 'kanji-trace',
  schema: kanjiTracePayloadSchema,
  mount(ctx: RendererContext): Promise<QuestionResult> {
    const payload = kanjiTracePayloadSchema.parse(ctx.question.payload);
    const order = payload.choices ? shuffleIds(payload.choices, `${ctx.question.id}:${Date.now()}`) : [];
    const startedAt = performance.now();
    return new Promise((resolve) => {
      render(
        h(KanjiTraceView, {
          payload,
          ctx,
          order,
          onDone: ({ score, timedOut, attempts, match, chosen }) => {
            render(null, ctx.container);
            resolve({
              questionId: ctx.question.id,
              score,
              timeMs: Math.round(performance.now() - startedAt),
              attempts,
              timedOut,
              detail: payload.mode === 'reading' ? { chosen, order } : { match },
            });
          },
        }),
        ctx.container,
      );
    });
  },
};
