import { h, render } from 'preact';
import type { QuestionRenderer, QuestionResult, RendererContext } from '../../contracts';
import { NumberBuildView } from './NumberBuildView';
import { numberBuildPayloadSchema } from './schema';

export const numberBuildRenderer: QuestionRenderer = {
  type: 'number-build',
  schema: numberBuildPayloadSchema,
  mount(ctx: RendererContext): Promise<QuestionResult> {
    const payload = numberBuildPayloadSchema.parse(ctx.question.payload);
    const startedAt = performance.now();
    return new Promise((resolve) => {
      render(
        h(NumberBuildView, {
          ctx,
          payload,
          onDone: ({ score, timedOut, value }) => {
            render(null, ctx.container);
            resolve({
              questionId: ctx.question.id,
              score,
              timeMs: Math.round(performance.now() - startedAt),
              attempts: timedOut ? 0 : 1,
              timedOut,
              detail: { mode: payload.mode, value },
            });
          },
        }),
        ctx.container,
      );
    });
  },
};
