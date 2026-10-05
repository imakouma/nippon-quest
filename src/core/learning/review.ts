import type { CurriculumGraph } from './model';
import { estimatedRetention, type ConceptStateData } from './state';

interface RankedReviewQuestion {
  questionId: string;
  priority: number;
}

/** 期限、推定定着率、問題との対応重みから、今出す復習問題を決定論的に並べる。 */
export function dueReviewQuestions(
  graph: CurriculumGraph,
  states: ConceptStateData,
  now: number,
  excludeQuestionIds: readonly string[] = [],
): RankedReviewQuestion[] {
  const excluded = new Set(excludeQuestionIds);
  return graph.questionLinks
    .filter((link) => !excluded.has(link.questionId))
    .map((link) => {
      let priority = 0;
      for (const mapped of link.concepts) {
        const state = states[mapped.conceptId];
        if (!state || state.dueAt > now) continue;
        const overdueDays = Math.max(0, now - state.dueAt) / 86_400_000;
        const need = 1 - estimatedRetention(state, now);
        priority += mapped.weight * need * (1 + Math.min(7, overdueDays) / 7);
      }
      return { questionId: link.questionId, priority };
    })
    .filter((item) => item.priority > 0)
    .sort((a, b) => b.priority - a.priority || a.questionId.localeCompare(b.questionId));
}
