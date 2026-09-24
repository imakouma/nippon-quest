/**
 * バッグ（どうぐ）と そうび。純粋関数のみ（GDD §4.6）。
 *  - つかう：HP・MP を かいふくする どうぐを フィールドで つかう
 *  - そうびする：バッグの そうびを その部位に つける（前の そうびは バッグに もどる）
 *  - はずす：そうびを バッグに もどす
 */
import { equipKinds, type Item } from '../content/schemas';
import type { GameState } from '../state/schema';

export type EquipSlot = (typeof equipKinds)[number];
export const EQUIP_SLOTS: readonly EquipSlot[] = equipKinds;

export const isEquip = (it: Item): it is Item & { kind: EquipSlot } =>
  (EQUIP_SLOTS as readonly string[]).includes(it.kind);

/** つかえる どうぐか（かいふくの どうぐで、HP か MP が へっている） */
export function canUse(gs: GameState, it: Item, max: { hp: number; mp: number }): boolean {
  if (it.kind !== 'consumable' || !it.use || (gs.inventory[it.id] ?? 0) <= 0) return false;
  return (!!it.use.heal && gs.player.hp < max.hp) || (!!it.use.mp && gs.player.mp < max.mp);
}

/** どうぐを つかう。つかえなければ null。healed＝ほんとうに かいふくした HP */
export function useItem(
  prev: GameState,
  it: Item,
  max: { hp: number; mp: number },
  now = Date.now(),
): { state: GameState; healed: number } | null {
  if (!canUse(prev, it, max)) return null;
  const gs = structuredClone(prev);
  const hp = Math.min(max.hp, gs.player.hp + (it.use?.heal ?? 0));
  const healed = hp - gs.player.hp;
  gs.player.hp = hp;
  gs.player.mp = Math.min(max.mp, gs.player.mp + (it.use?.mp ?? 0));
  gs.inventory[it.id] = (gs.inventory[it.id] ?? 0) - 1;
  gs.updatedAt = now;
  return { state: gs, healed };
}

/** そうびする（バッグから 1 つ へる。前の そうびは バッグへ）。そうびでない・もっていないなら null */
export function equipItem(prev: GameState, it: Item, now = Date.now()): GameState | null {
  if (!isEquip(it) || (prev.inventory[it.id] ?? 0) <= 0) return null;
  const gs = structuredClone(prev);
  const old = gs.player.equipment[it.kind];
  if (old) gs.inventory[old] = (gs.inventory[old] ?? 0) + 1;
  gs.inventory[it.id] = (gs.inventory[it.id] ?? 0) - 1;
  gs.player.equipment[it.kind] = it.id;
  if (!gs.dex.items.includes(it.id)) gs.dex.items.push(it.id);
  gs.updatedAt = now;
  return gs;
}

/** そうびを はずして バッグに もどす。何も つけていなければ null */
export function unequip(prev: GameState, slot: EquipSlot, now = Date.now()): GameState | null {
  const id = prev.player.equipment[slot];
  if (!id) return null;
  const gs = structuredClone(prev);
  delete gs.player.equipment[slot];
  gs.inventory[id] = (gs.inventory[id] ?? 0) + 1;
  gs.updatedAt = now;
  return gs;
}
