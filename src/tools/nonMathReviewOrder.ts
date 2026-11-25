import type { QuestionBase } from '../questions/contracts';
import kanji from '../../content/review/kanji-order.json';
import seikatsu from '../../content/review/seikatsu-order.json';
import eigo from '../../content/review/eigo-order.json';
import kokugo from '../../content/review/kokugo-order.json';
import rika from '../../content/review/rika-order.json';
import shakai from '../../content/review/shakai-order.json';

export const nonMathReviewOrders = [kokugo, kanji, rika, shakai, seikatsu, eigo];
const rankById = new Map(
  nonMathReviewOrders.flatMap(({ groups }) =>
    groups.flatMap(({ basic, standard, applied }) =>
      [...basic, ...standard, ...applied].map((id, index) => [id, index] as const),
    ),
  ),
);

export function orderUnitQuestions<T extends { q: QuestionBase | null; problem?: string | null }>(
  entries: readonly T[],
): T[] {
  const units = new Map<string, { entries: T[]; slots: number[] }>();
  entries.forEach((entry, slot) => {
    const q = entry.q;
    if (!q || entry.problem || q.subject === 'sansu' || !rankById.has(q.id)) return;
    const key = `${q.subject}:${q.grade}:${q.unit}`;
    let group = units.get(key);
    if (!group) units.set(key, (group = { entries: [], slots: [] }));
    group.entries.push(entry);
    group.slots.push(slot);
  });
  const ordered = [...entries];
  for (const group of units.values()) {
    group.entries.sort((a, b) => rankById.get(a.q!.id)! - rankById.get(b.q!.id)!);
    group.slots.forEach((slot, index) => {
      ordered[slot] = group.entries[index]!;
    });
  }
  return ordered;
}
