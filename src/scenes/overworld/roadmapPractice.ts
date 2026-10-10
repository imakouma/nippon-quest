import { h, render } from 'preact';
import type { ContentIndex } from '../../core/content/loader';
import type { GameState } from '../../core/state/schema';
import { QuestionFrame } from '../../ui/QuestionFrame';
import { t } from '../../ui/i18n';
import type { QuestionBank } from '../../questions/engine';
import { askById, MasteryStore } from '../../questions/engine';
import { buildAskEnv } from '../shared/askEnv';

export function pickRoadmapQuestionId(
  bank: QuestionBank,
  unitId: string,
  recent: readonly string[],
  rng: { next(): number },
): string | null {
  const questions = bank.all().filter((question) => question.unit === unitId);
  if (!questions.length) return null;
  const recentIds = new Set(recent);
  const fresh = questions.filter((question) => !recentIds.has(question.id));
  const pool = fresh.length ? fresh : questions;
  return pool[Math.floor(rng.next() * pool.length)]?.id ?? null;
}

export interface RoadmapPracticeHost {
  registry: { get(key: string): unknown };
  rng: { next(): number };
  speak: (text: string) => void;
  content(): ContentIndex | undefined;
  gs(): GameState | undefined;
  root(name: 'fx'): HTMLElement;
  talk(lines: { text: string }[]): Promise<void>;
  renderHud(): void;
}

export async function runRoadmapPractice(hostScene: RoadmapPracticeHost, unitId: string): Promise<void> {
  const content = hostScene.content();
  const bank = hostScene.registry.get('bank') as QuestionBank | undefined;
  const game = hostScene.gs();
  if (!content || !bank || !game) return;
  const questionId = pickRoadmapQuestionId(bank, unitId, game.learning.recent, hostScene.rng);
  if (!questionId) return hostScene.talk([{ text: t('field.roadmapNoQuestion') }]);
  const question = bank.get(questionId)!;
  const questionHost = document.createElement('div');
  questionHost.className = 'nq-bq-slot';
  const root = hostScene.root('fx');
  render(
    h(QuestionFrame, {
      host: questionHost,
      title: content.units.get(unitId)?.name ?? unitId,
      subject: question.subject,
      hint: t('field.roadmapQuestionHint'),
    }),
    root,
  );
  try {
    await askById(
      buildAskEnv({
        host: questionHost,
        gs: game,
        content,
        bank,
        mastery: new MasteryStore(game.learning.mastery),
        rng: hostScene.rng,
        speak: hostScene.speak,
        reason: 'review',
        getGame: () => hostScene.gs() ?? game,
      }),
      questionId,
    );
    hostScene.renderHud();
  } finally {
    render(null, root);
  }
}
