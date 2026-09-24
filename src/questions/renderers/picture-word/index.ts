/**
 * "picture-word"（絵を 見て、あう 英単語の カードを えらぶ）レンダラー。Preact 実装。
 * このフォルダは contracts.ts と ../shared、../../ui 以外を知らない（Phaser 禁止・GameState 禁止）。
 * 点数：1 回目で 正解 1.0、2 回目 0.5、2 回 まちがえたら 0（正解を 見せて おわる）。
 */
import { h, render } from 'preact';

import type { QuestionRenderer, QuestionResult, RendererContext } from '../../contracts';
import { shuffleIds } from '../shared/shuffle';
import { PictureWordView } from './PictureWordView';
import { pictureWordPayloadSchema } from './schema';

export const pictureWordRenderer: QuestionRenderer = {
  type: 'picture-word',
  schema: pictureWordPayloadSchema,
  mount(ctx: RendererContext): Promise<QuestionResult> {
    const payload = pictureWordPayloadSchema.parse(ctx.question.payload);
    const ids = payload.words.map((w) => w.id);
    const order = payload.shuffle ? shuffleIds(ids, `${ctx.question.id}:${Date.now()}`) : ids;
    const startedAt = performance.now();
    return new Promise((resolve) => {
      render(
        h(PictureWordView, {
          ctx,
          payload,
          order,
          onDone: ({ score, attempts, timedOut, picks }) => {
            render(null, ctx.container);
            resolve({
              questionId: ctx.question.id,
              score,
              timeMs: Math.round(performance.now() - startedAt),
              attempts,
              timedOut,
              detail: { picks, order },
            });
          },
        }),
        ctx.container,
      );
    });
  },
};
