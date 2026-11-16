import { h, render } from 'preact';
import { t } from '../../../ui/i18n';

import type { QuestionRenderer, QuestionResult, RendererContext } from '../../contracts';
import { shuffleIds } from '../shared/shuffle';
import { KanjiTraceView } from './KanjiTraceView';
import { kanjiTracePayloadSchema } from './schema';
import { gradeOneWriting } from './writingAssessment';
import { loadWriting } from './writingData';

export const kanjiTraceRenderer: QuestionRenderer = {
  type: 'kanji-trace',
  schema: kanjiTracePayloadSchema,
  async mount(ctx: RendererContext): Promise<QuestionResult> {
    const payload = kanjiTracePayloadSchema.parse(ctx.question.payload);
    let writing = gradeOneWriting;
    if (payload.mode === 'trace' && !writing[payload.kanji]) {
      render(h('div', { role: 'status' }, t('question.kanjiWriting.loading')), ctx.container);
      let onAbort = () => {};
      const aborted = new Promise<null>((resolve) => {
        onAbort = () => resolve(null);
        ctx.signal?.addEventListener('abort', onAbort, { once: true });
        if (ctx.signal?.aborted) onAbort();
      });
      try {
        const loaded = await Promise.race([loadWriting(payload.kanji), aborted]);
        if (!loaded || ctx.signal?.aborted)
          return { questionId: ctx.question.id, score: 0, attempts: 0, timeMs: 0, timedOut: true };
        writing = loaded;
      } finally {
        ctx.signal?.removeEventListener('abort', onAbort);
        render(null, ctx.container);
      }
    }
    const order = payload.choices ? shuffleIds(payload.choices, `${ctx.question.id}:${Date.now()}`) : [];
    const startedAt = performance.now();
    return new Promise((resolve) => {
      render(
        h(KanjiTraceView, {
          payload,
          writing,
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
