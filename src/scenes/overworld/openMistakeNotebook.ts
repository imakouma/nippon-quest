import { h, render } from 'preact';
import type { ContentIndex } from '../../core/content/loader';
import type { GameState } from '../../core/state/schema';
import { pressReviewStamp } from '../../core/progression/reviewStamps';
import type { Rng } from '../../core/rng';
import { askById } from '../../questions/engine/ask';
import type { QuestionBank } from '../../questions/engine/bank';
import { MistakeNotebook } from '../../ui/field/MistakeNotebook';
import { buildAskEnv } from '../shared/askEnv';
import { clearReviewedMistake } from './reviewQueue';
import { MasteryStore } from '../../questions/engine';
import { QuestionFrame } from '../../ui/QuestionFrame';
import { t } from '../../ui/i18n';
import { buildReviewQueue } from './reviewQueue';

type Runtime = {
  content: ContentIndex;
  bank: QuestionBank;
  gs: () => GameState | undefined;
  setGame: (game: GameState) => void;
  rng: Rng;
  speak: (text: string) => void;
};

async function askReview(runtime: Runtime, id: string, host: HTMLElement, signal?: AbortSignal) {
  const gs = runtime.gs();
  if (!gs) return false;
  const result = await askById(
    buildAskEnv({
      host,
      gs,
      content: runtime.content,
      bank: runtime.bank,
      mastery: new MasteryStore(gs.learning.mastery),
      rng: runtime.rng,
      speak: runtime.speak,
      reason: 'review',
      practice: true,
      getGame: () => runtime.gs() ?? gs,
    }),
    id,
    signal,
  );
  return !signal?.aborted && result.score >= 1;
}

export function openMistakeNotebook(
  root: HTMLElement,
  runtime: Runtime,
  onBack: () => void,
  onClose: () => void,
) {
  const initial = runtime.gs();
  if (!initial) return onBack();
  render(
    h(MistakeNotebook, {
      content: runtime.content,
      bank: runtime.bank,
      getGame: () => runtime.gs() ?? initial,
      onBack,
      onClose,
      async onReview(id, replay, host, signal) {
        if (!(await askReview(runtime, id, host, signal))) return false;
        const latest = runtime.gs();
        if (!latest) return false;
        if (!replay) {
          const next = clearReviewedMistake(latest, id);
          const pending = next.learning.pendingReviewStamps ?? [];
          if (
            !pending.includes(id) &&
            !next.learning.reviewStamps?.some((stamp) => stamp.questionId === id)
          ) {
            runtime.setGame({
              ...next,
              learning: { ...next.learning, pendingReviewStamps: [...pending, id] },
            });
          } else runtime.setGame(next);
        }
        return true;
      },
      onStamp(id, x, y) {
        const gs = runtime.gs();
        if (!gs?.learning.pendingReviewStamps?.includes(id)) return;
        runtime.setGame(
          pressReviewStamp(gs, { questionId: id, at: Date.now(), x, y, seed: runtime.rng.int(0, 65535) }),
        );
      },
    }),
    root,
  );
}

export async function runInnReview(
  root: HTMLElement,
  runtime: Runtime,
  announce: (count: number) => Promise<unknown>,
): Promise<number> {
  const game = runtime.gs();
  if (!game) return 0;
  const ids = buildReviewQueue(game, runtime.bank, Date.now());
  await announce(ids.length);
  let perfect = 0;
  for (const id of ids) {
    const question = runtime.bank.get(id);
    if (!question) continue;
    const host = document.createElement('div');
    host.className = 'nq-bq-slot';
    render(
      h(QuestionFrame, {
        host,
        title: t('field.tabMistakes'),
        subject: question.subject,
        hint: t('field.questionHint'),
      }),
      root,
    );
    try {
      if (await askReview(runtime, id, host)) {
        runtime.setGame(clearReviewedMistake(runtime.gs() ?? game, id));
        perfect++;
      }
    } finally {
      render(null, root);
    }
  }
  return perfect;
}
