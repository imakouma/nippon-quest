import type { Grade, QuestionQuery } from '../contracts';

/**
 * 小1・小2体験では、技やイベントが広い学年帯を持っていても
 * プレイヤーが選んだ学年だけを出題する。範囲外なら元の範囲へ丸める。
 */
export function scopeQueryToGrade(query: QuestionQuery, grade: Grade): QuestionQuery {
  const [lo, hi] = query.gradeRange;
  const scoped = Math.min(hi, Math.max(lo, grade)) as Grade;
  return { ...query, gradeRange: [scoped, scoped] };
}
