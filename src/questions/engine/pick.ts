/**
 * 出題選択（GDD §5.4）。
 *  - 教科・学年帯・タイプ・タグでフィルタ
 *  - 直近 N 問（excludeIds）を除外
 *  - 弱い単元 : 復習 = adaptiveWeakUnitRatio : 残り
 *  - 乱数はシード付き（対戦の決定論性のため）
 */
import type { QuestionBase, QuestionQuery } from '../contracts';
import type { QuestionBank } from './bank';
import type { MasteryStore } from './mastery';

export interface PickRng {
  next(): number; // [0,1)
}

export interface PickOptions {
  weakUnitRatio?: number; // 既定 0.7
  masteryThreshold?: number; // 既定 0.7
}

export function filterCandidates(bank: QuestionBank, q: QuestionQuery): QuestionBase[] {
  const [lo, hi] = q.gradeRange;
  const exclude = new Set(q.excludeIds ?? []);
  let list = bank.subject(q.subject).filter((x) => x.grade >= lo && x.grade <= hi && !exclude.has(x.id));
  if (q.type) list = list.filter((x) => x.type === q.type);
  if (q.tags?.length) {
    const tagged = list.filter((x) => q.tags!.every((t) => x.tags?.includes(t)));
    // タグ完全一致があればそれを優先。無ければ部分一致 → それも無ければタグ無視（出題ゼロを避ける）
    if (tagged.length) list = tagged;
    else {
      const partial = list.filter((x) => q.tags!.some((t) => x.tags?.includes(t)));
      if (partial.length) list = partial;
    }
  }
  return list;
}

export function pickQuestion(
  bank: QuestionBank,
  q: QuestionQuery,
  mastery: MasteryStore,
  rng: PickRng,
  opts: PickOptions = {},
): QuestionBase | null {
  const ratio = opts.weakUnitRatio ?? 0.7;
  const threshold = opts.masteryThreshold ?? 0.7;
  let candidates = filterCandidates(bank, q);
  if (candidates.length === 0) {
    // 除外を外して再挑戦（問題数が少ない単元で詰まらないように）
    candidates = filterCandidates(bank, { ...q, excludeIds: [] });
    if (candidates.length === 0) return null;
  }
  const units = [...new Set(candidates.map((c) => c.unit))];
  const preferred = new Set(q.preferUnits ?? mastery.weakUnits(units, threshold));
  const weak = candidates.filter((c) => preferred.has(c.unit));
  const review = candidates.filter((c) => !preferred.has(c.unit));
  const pool =
    weak.length && review.length ? (rng.next() < ratio ? weak : review) : weak.length ? weak : review;
  return pool[Math.floor(rng.next() * pool.length)] ?? null;
}
