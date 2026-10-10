/**
 * 問題エンジン（ask）に渡す環境を作る。バトルの「わざ」とフィールドの名所イベントで共通。
 * ゲーム本体は問題タイプを知らない（docs/01 §3.3）。ここも score しか見ない。
 */
import type { ContentIndex } from '../../core/content/loader';
import type { Settings } from '../../core/content/schemas';
import type { GameState } from '../../core/state/schema';
import {
  appendAttemptEvent,
  applyAttemptToConcepts,
  createAttemptEvent,
  nextAttemptSequence,
  questionLinksById,
  type AttemptEvent,
} from '../../core/learning';
import type { QuestionBase, QuestionQuery, QuestionResult } from '../../questions/contracts';
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
  /** 長い処理中に別経路が GameState を差し替える場合、回答時点の最新版を返す。 */
  getGame: () => GameState;
}

/** 問題への回答で変わる学習状態と、その更新時刻を一度に記録する。 */
export function recordLearningResult(
  gs: GameState,
  question: QuestionBase,
  result: QuestionResult,
  presentedAt: number,
  answeredAt: number,
  reason: AttemptEvent['reason'] = 'unknown',
  wisdom?: Settings['learningWisdom'],
): AttemptEvent {
  const event = createAttemptEvent({
    questionId: question.id,
    result,
    presentedAt,
    answeredAt,
    sequence: nextAttemptSequence(gs.learning.attempts),
    reason,
    appVersion: '0.1.0',
  });
  appendAttemptEvent(gs.learning.attempts, event);
  const link = questionLinksById.get(question.id);
  if (link) gs.learning.conceptStates = applyAttemptToConcepts(gs.learning.conceptStates, event, link);
  if (wisdom && result.score >= wisdom.minScore) {
    gs.player.bonusWis = Math.min(
      wisdom.maxBonus,
      Math.round((gs.player.bonusWis + wisdom.perCorrect) * 100) / 100,
    );
  }
  gs.updatedAt = answeredAt;
  return event;
}

export function buildAskEnv(o: AskEnvOptions): AskEnv {
  if (typeof o.getGame !== 'function') throw new TypeError('buildAskEnv requires getGame');
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
      const game = o.getGame();
      const recordedMastery = o.mastery.toJSON();
      if (game.learning.mastery !== recordedMastery) {
        const unit = recordedMastery[question.unit];
        if (unit) game.learning.mastery[question.unit] = { ...unit };
      }
      if (game.learning.recent !== o.gs.learning.recent) {
        game.learning.recent.push(question.id);
        while (game.learning.recent.length > st.recentQuestionWindow) {
          game.learning.recent.shift();
        }
      }
      if (
        game.learning.mistakes !== o.gs.learning.mistakes &&
        result.score < 1 &&
        !game.learning.mistakes.includes(question.id)
      ) {
        game.learning.mistakes.push(question.id);
      }
      recordLearningResult(game, question, result, presentedAt, answeredAt, o.reason, st.learningWisdom);
      window.dispatchEvent(new CustomEvent('nq:learning-changed', { detail: game }));
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
