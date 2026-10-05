/**
 * 問題エンジン（ask）に渡す環境を作る。バトルの「わざ」とフィールドの名所イベントで共通。
 * ゲーム本体は問題タイプを知らない（docs/01 §3.3）。ここも score しか見ない。
 */
import type { ContentIndex } from '../../core/content/loader';
import type { GameState } from '../../core/state/schema';
import {
  applyAttemptToConcepts,
  createAttemptEvent,
  questionLinksById,
  type AttemptEvent,
} from '../../core/learning';
import type { QuestionQuery } from '../../questions/contracts';
import {
  ask,
  NoQuestionError,
  type AskEnv,
  type MasteryStore,
  type QuestionBank,
} from '../../questions/engine';

export interface AskEnvOptions {
  host: HTMLElement;
  gs: GameState;
  content: ContentIndex;
  bank: QuestionBank;
  mastery: MasteryStore;
  rng: { next(): number };
  speak: (text: string) => void;
  reason?: AttemptEvent['reason'];
}

export function buildAskEnv(o: AskEnvOptions): AskEnv {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const st = o.content.settings;
  const scale = o.gs.settings.timeLimitScale ?? 1;
  return {
    bank: o.bank,
    mastery: o.mastery,
    rng: o.rng,
    host: o.host,
    assets: { image: (p) => `${base}/assets/${p}`, audio: (p) => `${base}/assets/${p}` },
    speak: o.speak,
    playerGrade: o.gs.learning.grade,
    timeLimitSecByGrade: Object.fromEntries(
      Object.entries(st.timeLimitSecByGrade).map(([g, sec]) => [g, sec * scale]),
    ),
    recentWindow: st.recentQuestionWindow,
    weakUnitRatio: st.adaptiveWeakUnitRatio,
    recent: o.gs.learning.recent,
    mistakes: o.gs.learning.mistakes,
    onResult: (question, result, presentedAt) => {
      const answeredAt = Date.now();
      const event = createAttemptEvent({
        questionId: question.id,
        result,
        presentedAt,
        answeredAt,
        sequence: o.gs.learning.attempts.length,
        reason: o.reason ?? 'unknown',
        appVersion: '0.1.0',
      });
      o.gs.learning.attempts.push(event);
      const link = questionLinksById.get(question.id);
      if (link)
        o.gs.learning.conceptStates = applyAttemptToConcepts(o.gs.learning.conceptStates, event, link);
      window.dispatchEvent(new CustomEvent('nq:learning-changed', { detail: o.gs }));
    },
  };
}

/**
 * イベント用：条件を少しずつゆるめた問い合わせの列。
 * content に書かれたタイプ（まだ作っていないタイプかもしれない）→ タイプ無し → タグ無し → 学年無し の順。
 */
export function relaxedQueries(q: QuestionQuery): QuestionQuery[] {
  const plain: QuestionQuery = { subject: q.subject, gradeRange: q.gradeRange };
  return [q, { ...plain, tags: q.tags }, plain, { ...plain, gradeRange: [1, 6] }];
}

/** 出せる問題が見つかるまで順に試して score を返す。どれも無ければ null */
export async function askFirst(env: AskEnv, queries: QuestionQuery[]): Promise<number | null> {
  for (const q of queries) {
    try {
      return (await ask(env, q)).score;
    } catch (e) {
      if (!(e instanceof NoQuestionError)) throw e;
    }
  }
  return null;
}
