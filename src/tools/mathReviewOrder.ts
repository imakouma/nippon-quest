import order from '../../content/review/sansu-g1-order.json';
import type { QuestionBase } from '../questions/contracts';

export const mathReviewGroupsByGrade: Record<number, typeof order.groups> = { 1: order.groups };
const mathReviewGroups = Object.values(mathReviewGroupsByGrade).flat();
const groupByQuestion = new Map(
  mathReviewGroups.flatMap((group) => group.questionIds.map((id) => [id, group.id] as const)),
);
const rankByQuestion = new Map(
  mathReviewGroups.flatMap((group) => group.questionIds).map((id, index) => [id, index]),
);

export function mathReviewMatches(q: QuestionBase | null, scope: string): boolean {
  return (
    !!q &&
    q.subject === 'sansu' &&
    q.grade >= 1 &&
    q.grade <= 6 &&
    scope === `math-review:${q.grade}:${groupByQuestion.get(q.id) ?? 'unclassified'}`
  );
}

export function mathReviewRank(q: QuestionBase | null): number {
  return q ? (rankByQuestion.get(q.id) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
}
