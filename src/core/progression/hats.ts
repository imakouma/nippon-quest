/**
 * かぶりもの。純粋関数のみ。
 *  - 県の 名所スタンプ（にほんちずの ★）を ぜんぶ あつめると、その県の かぶりものが もらえる
 *  - かぶりものは だいじな もの（kind: key）で、id が `<県>-…-kaburimono`、areaOrigin が その県
 *  - かぶると GameState.player.appearance.hat に 入り、歩く 主人公・バトルの 主人公の ぼうしが かわる（見た目だけ）
 */
import type { Item } from '../content/schemas';
import type { GameState } from '../state/schema';
import { motifStamp } from './route';

export const isHat = (it: Pick<Item, 'id' | 'kind'>): boolean =>
  it.kind === 'key' && /-kaburimono$/.test(it.id);

/**
 * いま もらえる（県の スタンプが ぜんぶ そろっていて、まだ もっていない）かぶりもの。
 * stampsOf(県) は その県の 名所スタンプの motif id ぜんぶ（にほんちずの ★ と 同じ）。空の 県では もらえない
 */
export function hatsEarned(
  gs: GameState,
  items: Iterable<Item>,
  stampsOf: (areaId: string) => readonly string[],
): Item[] {
  const have = new Set(gs.dex.motifs);
  return [...items].filter((it) => {
    if (!isHat(it) || !it.areaOrigin || (gs.inventory[it.id] ?? 0) > 0) return false;
    const stamps = stampsOf(it.areaOrigin);
    return stamps.length > 0 && stamps.every((m) => have.has(motifStamp(it.areaOrigin!, m)));
  });
}

/** かぶりものを もらう（バッグの だいじな もの・ずかんに のせる） */
export function giveHat(prev: GameState, it: Item, now = Date.now()): GameState {
  const gs = structuredClone(prev);
  gs.inventory[it.id] = Math.max(1, gs.inventory[it.id] ?? 0);
  if (!gs.dex.items.includes(it.id)) gs.dex.items.push(it.id);
  gs.updatedAt = now;
  return gs;
}

/** かぶる（null＝ぬぐ）。もっていない かぶりものは かぶれない（null を かえす） */
export function wearHat(prev: GameState, hatId: string | null, now = Date.now()): GameState | null {
  if (hatId !== null && (prev.inventory[hatId] ?? 0) <= 0) return null;
  if (prev.player.appearance.hat === hatId) return null;
  const gs = structuredClone(prev);
  gs.player.appearance.hat = hatId;
  gs.updatedAt = now;
  return gs;
}
