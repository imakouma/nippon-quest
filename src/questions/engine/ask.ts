/**
 * ゲーム本体が呼ぶ唯一の入口: ask(query) → QuestionResult
 * 選択（pick）→ レンダラー mount → 結果を MasteryStore と履歴に記録して返す。
 */
import type {
  AssetResolver,
  Grade,
  QuestionBase,
  QuestionQuery,
  QuestionResult,
  RendererContext,
} from '../contracts';
import { requireRenderer } from '../renderers/registry';
import type { QuestionBank } from './bank';
import type { MasteryStore } from './mastery';
import { pickQuestion, type PickRng } from './pick';

export interface AskEnv {
  bank: QuestionBank;
  mastery: MasteryStore;
  rng: PickRng;
  /** 問題UIを載せる DOM 要素（毎回中身を空にして渡す） */
  host: HTMLElement;
  assets: AssetResolver;
  speak: (text: string) => void;
  playerGrade: Grade;
  timeLimitSecByGrade: Record<string, number>;
  recentWindow: number;
  weakUnitRatio: number;
  /** 直近出題 id（GameState に保存） */
  recent: string[];
  /** まちがいノート（score < 1 の問題 id） */
  mistakes: string[];
}

export interface AskResult extends QuestionResult {
  /** 出題した問題の単元（習熟度表示・ミッション判定用） */
  unit: string;
  subject: string;
}

export class NoQuestionError extends Error {
  constructor(public readonly query: QuestionQuery) {
    super(`出題できる問題がありません: ${JSON.stringify(query)}`);
  }
}

export async function ask(env: AskEnv, query: QuestionQuery, signal?: AbortSignal): Promise<AskResult> {
  const q = pickQuestion(
    env.bank,
    { ...query, excludeIds: [...(query.excludeIds ?? []), ...env.recent] },
    env.mastery,
    env.rng,
    {
      weakUnitRatio: env.weakUnitRatio,
    },
  );
  if (!q) throw new NoQuestionError(query);

  return runQuestion(env, q, signal);
}

/** まちがいノートなど、IDが決まっている問題をもう一度出す。 */
export async function askById(env: AskEnv, id: string, signal?: AbortSignal): Promise<AskResult> {
  const question = env.bank.get(id);
  if (!question) throw new Error(`問題が見つかりません: ${id}`);
  return runQuestion(env, question, signal);
}

async function runQuestion(env: AskEnv, q: QuestionBase, signal?: AbortSignal): Promise<AskResult> {
  const renderer = requireRenderer(q.type);
  const timeLimitSec = q.timeLimitSec ?? env.timeLimitSecByGrade[String(q.grade)] ?? 20;

  const container = document.createElement('div');
  container.className = 'nq-question-root';
  env.host.replaceChildren(container);

  const ctx: RendererContext = {
    container,
    question: q,
    grade: env.playerGrade,
    assets: env.assets,
    speak: env.speak,
    timeLimitMs: timeLimitSec * 1000,
    signal,
  };

  let result: QuestionResult;
  try {
    result = await renderer.mount(ctx);
  } finally {
    renderer.unmount?.();
    env.host.replaceChildren();
  }
  // score を 0〜1 に丸める（レンダラーのバグで範囲外が来てもゲームが壊れないように）
  result.score = Math.min(1, Math.max(0, Number.isFinite(result.score) ? result.score : 0));

  env.mastery.record(q.unit, result);
  env.recent.push(q.id);
  while (env.recent.length > env.recentWindow) env.recent.shift();
  if (result.score < 1 && !env.mistakes.includes(q.id)) env.mistakes.push(q.id);

  return { ...result, unit: q.unit, subject: q.subject };
}
