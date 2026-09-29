/**
 * めいさんひんの そうび（県の ごほうび）。純粋関数のみ。
 *  - 県の 名所スタンプ（にほんちずの ★）を ぜんぶ あつめると、その県の めいさんひんの そうびが もらえる
 *  - id が `<県>-meisan-<名産品>`、kind が そうびの 部位、areaOrigin が その県の どうぐ
 *  - ふつうの そうびと 同じく バッグに いれると 強くなり（stats）、主人公の 絵も かわる（scenes/art/costumes.ts）
 */
import type { Item } from '../content/schemas';
import type { GameState } from '../state/schema';
import { isEquip } from './inventory';
import { motifStamp } from './route';

export const isMeisanGear = (it: Item): boolean =>
  isEquip(it) && /^[a-z]+-meisan-/.test(it.id) && !!it.areaOrigin;

/** もっている（あずけている か そうびしている） */
const owns = (gs: GameState, id: string): boolean =>
  (gs.inventory[id] ?? 0) > 0 || Object.values(gs.player.equipment).includes(id);

/**
 * いま もらえる（県の スタンプが ぜんぶ そろっていて、まだ もっていない）めいさんひんの そうび。
 * stampsOf(県) は その県の 名所スタンプの motif id ぜんぶ（にほんちずの ★ と 同じ）。空の 県では もらえない
 */
export function meisanEarned(
  gs: GameState,
  items: Iterable<Item>,
  stampsOf: (areaId: string) => readonly string[],
): Item[] {
  const have = new Set(gs.dex.motifs);
  return [...items].filter((it) => {
    if (!isMeisanGear(it) || owns(gs, it.id)) return false;
    const stamps = stampsOf(it.areaOrigin!);
    return stamps.length > 0 && stamps.every((m) => have.has(motifStamp(it.areaOrigin!, m)));
  });
}

/** もらう（あずけている どうぐに 1 つ 入れて、ずかんに のせる） */
export function giveMeisan(prev: GameState, it: Item, now = Date.now()): GameState {
  const gs = structuredClone(prev);
  gs.inventory[it.id] = (gs.inventory[it.id] ?? 0) + 1;
  if (!gs.dex.items.includes(it.id)) gs.dex.items.push(it.id);
  gs.updatedAt = now;
  return gs;
}
