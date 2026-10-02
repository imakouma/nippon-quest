import { h, render } from 'preact';
import type { QuestionRenderer, QuestionResult, RendererContext } from '../../contracts';
import { ExperimentView } from './ExperimentView';
import { experimentPayloadSchema } from './schema';

export const experimentRenderer: QuestionRenderer = {
  type: 'experiment',
  schema: experimentPayloadSchema,
  mount(ctx: RendererContext): Promise<QuestionResult> {
    const payload = experimentPayloadSchema.parse(ctx.question.payload);
    const startedAt = performance.now();
    return new Promise((resolve) => {
      render(
        h(ExperimentView, {
          ctx,
          payload,
          onDone: ({ score, timedOut, prediction, runs }) => {
            render(null, ctx.container);
            resolve({
              questionId: ctx.question.id,
              score,
              timeMs: Math.round(performance.now() - startedAt),
              attempts: runs,
              timedOut,
              detail: { prediction, runs },
            });
          },
        }),
        ctx.container,
      );
    });
  },
};
