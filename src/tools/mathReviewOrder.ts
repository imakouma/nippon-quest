import order from '../../content/review/sansu-g1-order.json';
import grade2 from '../../content/review/sansu-g2-order.json';
import grade3 from '../../content/review/sansu-g3-order.json';
import grade4 from '../../content/review/sansu-g4-order.json';
import type { QuestionBase } from '../questions/contracts';

export const mathReviewGroupsByGrade: Record<number, typeof order.groups> = {
  1: order.groups,
  2: grade2.groups,
  3: grade3.groups,
  4: grade4.groups,
};
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
