/**
 * "choice"（2〜4択）レンダラー。Preact 実装。
 * このフォルダは contracts.ts と ../shared、../../ui 以外を知らない（Phaser 禁止・GameState 禁止）。
 */
import { h, render } from 'preact';

import type { QuestionRenderer, QuestionResult, RendererContext } from '../../contracts';
import { shuffleIds } from '../shared/shuffle';
import { choicePayloadSchema } from './schema';
import { ChoiceView } from './ChoiceView';

export const choiceRenderer: QuestionRenderer = {
  type: 'choice',
  schema: choicePayloadSchema,
  mount(ctx: RendererContext): Promise<QuestionResult> {
    const payload = choicePayloadSchema.parse(ctx.question.payload);
    const ids = payload.choices.map((c) => c.id);
    const order = payload.shuffle ? shuffleIds(ids, `${ctx.question.id}:${Date.now()}`) : ids;
    const startedAt = performance.now();
    return new Promise((resolve) => {
      render(
        h(ChoiceView, {
          ctx,
          payload,
          order,
          onDone: ({ score, attempts, timedOut, chosen }) => {
            render(null, ctx.container);
            resolve({
              questionId: ctx.question.id,
              score,
              timeMs: Math.round(performance.now() - startedAt),
              attempts,
              timedOut,
              detail: { chosen, order },
            });
          },
        }),
        ctx.container,
      );
    });
  },
};
