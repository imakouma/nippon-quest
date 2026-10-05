import { h, render } from 'preact';
import type { QuestionRenderer, QuestionResult, RendererContext } from '../../contracts';
import { TextInputView } from './TextInputView';
import { textInputPayloadSchema } from './schema';

export const textInputRenderer: QuestionRenderer = {
  type: 'text-input',
  schema: textInputPayloadSchema,
  mount(ctx: RendererContext): Promise<QuestionResult> {
    const payload = textInputPayloadSchema.parse(ctx.question.payload);
    const startedAt = performance.now();
    return new Promise((resolve) =>
      render(
        h(TextInputView, {
          ctx,
          payload,
          onDone: ({ score, values, timedOut }) => {
            render(null, ctx.container);
            resolve({
              questionId: ctx.question.id,
              score,
              timeMs: Math.round(performance.now() - startedAt),
              attempts: timedOut ? 0 : 1,
              timedOut,
              detail: { values },
            });
          },
        }),
        ctx.container,
      ),
    );
  },
};
