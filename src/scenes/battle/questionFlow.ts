import type { ContentIndex } from '../../core/content/loader';
import type { GameState } from '../../core/state/schema';
import type { ActionResult } from '../../core/battle/types';
import type { QuestionQuery } from '../../questions/contracts';
import { ask, NoQuestionError, type MasteryStore, type QuestionBank } from '../../questions/engine';
import { buildAskEnv } from '../shared/askEnv';

/** バトル中に問題を表示するための Scene/UI 接続口。 */
export interface BattleQuestionPort {
  show(input: {
    host: HTMLElement;
    skillName: string;
    subject: string;
    hint: string;
    abort: AbortController;
  }): void;
  hide(): void;
}

/** DOM 問題の生成・中断・採点結果の変換を一箇所に閉じる。 */
export async function runBattleQuestion(input: {
  query: QuestionQuery;
  title: string;
  subject: string;
  hint: string;
  game: GameState;
  content: ContentIndex;
  bank: QuestionBank;
  mastery: MasteryStore;
  rng: { next(): number };
  speak: (text: string) => void;
  now: () => number;
  port: BattleQuestionPort;
  getGame: () => GameState;
}): Promise<ActionResult> {
  const host = document.createElement('div');
  host.className = 'nq-bq-slot';
  const abort = new AbortController();
  input.port.show({ host, skillName: input.title, subject: input.subject, hint: input.hint, abort });
  const env = buildAskEnv({
    host,
    gs: input.game,
    content: input.content,
    bank: input.bank,
    mastery: input.mastery,
    rng: input.rng,
    speak: input.speak,
    reason: 'battle',
    getGame: input.getGame,
  });
  const startedAt = input.now();
  try {
    const result = await ask(env, input.query, abort.signal);
    return { score: result.score, timeMs: Math.round(input.now() - startedAt), attempts: 1 };
  } catch (error) {
    if (error instanceof NoQuestionError) return { score: 0, timeMs: 0, attempts: 0 };
    throw error;
  } finally {
    input.port.hide();
  }
}
