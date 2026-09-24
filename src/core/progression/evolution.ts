/**
 * 仲間モンスターの しんか。純粋関数のみ。
 * monsters の evolution { to, item, count?, minLevel? } を見て、手持ちの どうぐを count こ 使い、owned の monsterId を to に変える。
 * レベル・けいけんち・uid・ニックネームは そのまま。図鑑に しんか後のモンスターを登録する。
 * しんか先にも evolution があれば、もう一度 しんかできる（ネブタン → ネブタムシャ → ネブタイショウ）。
 */
import type { Monster } from '../content/schemas';
import type { GameState, OwnedMonster } from '../state/schema';

export interface EvolutionInfo {
  to: Monster;
  itemId: string;
  /** しんかに使う どうぐの数 */
  need: number;
  /** 手持ちの しんかの どうぐの数 */
  have: number;
  minLevel: number;
  /** いま しんかできるか（どうぐが need こ以上あって、レベルも足りている） */
  ok: boolean;
}

/** その仲間が しんかできるモンスターなら、しんか先と条件。しんかしないモンスターは null */
export function evolutionOf(
  gs: GameState,
  owned: OwnedMonster,
  monsters: ReadonlyMap<string, Monster>,
): EvolutionInfo | null {
  const evo = monsters.get(owned.monsterId)?.evolution;
  const to = evo && monsters.get(evo.to);
  if (!evo || !to) return null;
  const need = evo.count ?? 1;
  const have = gs.inventory[evo.item] ?? 0;
  const minLevel = evo.minLevel ?? 1;
  return { to, itemId: evo.item, need, have, minLevel, ok: have >= need && owned.level >= minLevel };
}

/** しんかさせる。できないときは null（元の GameState は書き換えない） */
export function evolve(
  prev: GameState,
  uid: string,
  monsters: ReadonlyMap<string, Monster>,
  now = Date.now(),
): GameState | null {
  const owned = prev.party.owned.find((o) => o.uid === uid);
  const info = owned && evolutionOf(prev, owned, monsters);
  if (!owned || !info?.ok) return null;
  const gs = structuredClone(prev);
  gs.party.owned.find((o) => o.uid === uid)!.monsterId = info.to.id;
  gs.inventory[info.itemId] = info.have - info.need;
  if (!gs.dex.monsters.includes(info.to.id)) gs.dex.monsters.push(info.to.id);
  gs.updatedAt = now;
  return gs;
}
