import {
  curriculumGraph,
  diagnosisCandidates,
  dueReviewQuestions,
  pickDiagnosticQuestion,
  questionLinksById,
} from '../../core/learning';
import type { GameState } from '../../core/state/schema';
import type { QuestionBank } from '../../questions/engine';

/** 復習で正解した問題を、保存可能な新しい状態としてまちがい一覧から外す。 */
export function clearReviewedMistake(prev: GameState, questionId: string, now = Date.now()): GameState {
  if (!prev.learning.mistakes.includes(questionId)) return prev;
  return {
    ...prev,
    updatedAt: now,
    learning: {
      ...prev.learning,
      mistakes: prev.learning.mistakes.filter((id) => id !== questionId),
    },
  };
}

/** 誤答、切り分け問題、期限到来問題を重複なく組み合わせる。 */
export function buildReviewQueue(gs: GameState, bank: QuestionBank | undefined, now: number): string[] {
  if (!bank) return [];
  const mistakes = gs.learning.mistakes.filter((id) => bank.get(id));
  const recentFailure = [...gs.learning.attempts]
    .reverse()
    .find((attempt) => attempt.score < 0.8 && questionLinksById.has(attempt.questionId));
  const sourceLink = recentFailure ? questionLinksById.get(recentFailure.questionId) : undefined;
  const diagnostic = sourceLink
    ? pickDiagnosticQuestion(
        curriculumGraph.questionLinks,
        diagnosisCandidates(
          curriculumGraph,
          sourceLink,
          gs.learning.conceptStates,
          recentFailure?.finalAnswer,
          now,
        ),
        mistakes,
      )?.questionId
    : undefined;
  const due = dueReviewQuestions(curriculumGraph, gs.learning.conceptStates, now, mistakes).map(
    ({ questionId }) => questionId,
  );
  const ordered = [mistakes[0], diagnostic, ...mistakes.slice(1), ...due];
  return [...new Set(ordered.filter((id): id is string => Boolean(id && bank.get(id))))].slice(0, 3);
}
