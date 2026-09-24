/**
 * バッグの マスの ならび：入れた もの（cost マスぶんの 横長）→ あいている マス → まだ ひらいていない マス（あく レベルつき）。
 * 純粋関数（画面は BagOverlay）。
 */
import { slotUnlockLevel, type BagSettings } from '../../core/progression/bag';

export type BagCell =
  { kind: 'item'; key: string; span: number } | { kind: 'empty' } | { kind: 'locked'; level: number };

/** items は バッグの 中身（この じゅんに ならべる）。マスより 多く 入っている 古いセーブでも ぜんぶ 出す */
export function bagCells(
  items: readonly { key: string; cost: number }[],
  capacity: number,
  cfg: BagSettings,
): BagCell[] {
  const used = items.reduce((n, x) => n + x.cost, 0);
  const cells: BagCell[] = items.map((x) => ({ kind: 'item', key: x.key, span: x.cost }));
  for (let i = used; i < capacity; i++) cells.push({ kind: 'empty' });
  for (let i = Math.max(used, capacity); i < cfg.maxSlots; i++)
    cells.push({ kind: 'locked', level: slotUnlockLevel(i, cfg) });
  return cells;
}
