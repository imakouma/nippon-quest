/**
 * バッグ：仲間モンスターと そうびを 入れる マス。バッグに 入れた ものだけ、バトルに 出せる・そうびが きく。
 *  - マスの数は 主人公の レベルで ふえる（settings.bag：さいしょ baseSlots こ、levelsPerSlot レベルごとに +1、maxSlots まで）
 *  - 仲間は しんかの だんかい ぶん マスを つかう（しんか前 1・1 かい しんか 2・2 かい しんか 3）
 *  - そうびは 1 こ 1 マス。バッグに 入っている そうび ＝ そうびちゅう（player.equipment。同じ部位は 1 つ）
 *  - やくそう・そざい・しんかの どうぐ は マスを つかわない（inventory のまま）
 * バッグの 仲間は party.team（先頭が せんとう＝バトルで さいしょに出る）。体の 上限は なく、マスの数で きまる。
 * 純粋関数のみ。
 */
import type { ContentIndex } from '../content/loader';
import type { Item, Monster, Settings } from '../content/schemas';
import type { GameState } from '../state/schema';
import { heroLevel } from './battleResult';
import { equipItem, isEquip } from './inventory';

export type BagSettings = Settings['bag'];

export interface BagContext {
  monsters: ReadonlyMap<string, Monster>;
  /** いまの マスの数 */
  capacity: number;
}

/** 主人公の レベルで きまる マスの数 */
export function bagCapacity(level: number, cfg: BagSettings): number {
  return Math.min(cfg.maxSlots, cfg.baseSlots + Math.floor((Math.max(1, level) - 1) / cfg.levelsPerSlot));
}

/** i ばんめ（0 から）の マスが あく レベル。はじめから ある マスは 1 */
export function slotUnlockLevel(i: number, cfg: BagSettings): number {
  return i < cfg.baseSlots ? 1 : (i - cfg.baseSlots + 1) * cfg.levelsPerSlot + 1;
}

/** つぎに マスが ふえる レベル。もう ふえないなら null */
export function nextSlotLevel(level: number, cfg: BagSettings): number | null {
  const cap = bagCapacity(level, cfg);
  return cap >= cfg.maxSlots ? null : slotUnlockLevel(cap, cfg);
}

/** GameState と content から いまの バッグの 大きさ */
export function bagContext(gs: GameState, c: Pick<ContentIndex, 'monsters' | 'xp' | 'settings'>): BagContext {
  return { monsters: c.monsters, capacity: bagCapacity(heroLevel(gs, c.xp.hero), c.settings.bag) };
}

const stageMemo = new WeakMap<ReadonlyMap<string, Monster>, Map<string, number>>();

/**
 * しんかの だんかい（1 = しんか前、2 = 1 かい しんか、3 = 2 かい しんか）。
 * monsters の evolution.to を さかのぼって 数える（しんか先の モンスターを そのまま 仲間にしても 同じ）
 */
export function evolutionStage(monsterId: string, monsters: ReadonlyMap<string, Monster>): number {
  let memo = stageMemo.get(monsters);
  if (!memo) {
    const from = new Map<string, string>();
    for (const m of monsters.values()) if (m.evolution) from.set(m.evolution.to, m.id);
    memo = new Map();
    for (const id of monsters.keys()) {
      const seen = new Set([id]);
      let cur = id;
      while (from.has(cur) && !seen.has(from.get(cur)!)) {
        cur = from.get(cur)!;
        seen.add(cur);
      }
      memo.set(id, seen.size);
    }
    stageMemo.set(monsters, memo);
  }
  return memo.get(monsterId) ?? 1;
}

/** 仲間が つかう マスの数（しんかの だんかい） */
export const monsterCost = evolutionStage;

/**
 * バッグに 入っている 仲間の uid（先頭が せんとう）。
 * party.team が 空の 古いセーブは、せんとう（activeUid）の 1 体だけ。
 * 仲間を ぜんぶ 出したときは activeUid も null に するので、空の まま
 */
export function bagMonsterUids(gs: GameState): string[] {
  const owned = new Set(gs.party.owned.map((o) => o.uid));
  const lead = gs.party.activeUid;
  const saved = [...new Set(gs.party.team.filter((u) => owned.has(u)))];
  const bag = saved.length ? saved : lead && owned.has(lead) ? [lead] : [];
  return lead && bag.includes(lead) ? [lead, ...bag.filter((u) => u !== lead)] : bag;
}

/** バッグに 入っている そうび（部位の じゅん） */
export function bagEquipCount(gs: GameState): number {
  return Object.values(gs.player.equipment).filter(Boolean).length;
}

export interface BagUsage {
  used: number;
  capacity: number;
  /** あいている マス（マスより 多く 入っている 古いセーブでも 0） */
  free: number;
  /** マスより 多く 入っている（マスが できる前の セーブ）。出すことは できるが 入れられない */
  over: boolean;
}

export function bagUsage(gs: GameState, ctx: BagContext): BagUsage {
  const owned = new Map(gs.party.owned.map((o) => [o.uid, o]));
  const used =
    bagMonsterUids(gs).reduce((n, uid) => n + monsterCost(owned.get(uid)!.monsterId, ctx.monsters), 0) +
    bagEquipCount(gs);
  return { used, capacity: ctx.capacity, free: Math.max(0, ctx.capacity - used), over: used > ctx.capacity };
}

export type BagMove = 'added' | 'removed' | 'swapped' | 'full' | 'none';

/** せんとう（activeUid）が バッグに いなければ、バッグの 先頭に あわせる */
function fixLead(gs: GameState): void {
  if (!gs.party.activeUid || !gs.party.team.includes(gs.party.activeUid))
    gs.party.activeUid = gs.party.team[0] ?? null;
}

/** 仲間を バッグに 入れる / 出す。マスが たりなければ 入れられない（full） */
export function toggleBagMonster(
  prev: GameState,
  uid: string,
  ctx: BagContext,
  now = Date.now(),
): { state: GameState; result: BagMove } {
  const o = prev.party.owned.find((x) => x.uid === uid);
  if (!o) return { state: prev, result: 'none' };
  const bag = bagMonsterUids(prev);
  const gs = structuredClone(prev);
  if (bag.includes(uid)) {
    gs.party.team = bag.filter((u) => u !== uid);
    fixLead(gs);
    gs.updatedAt = now;
    return { state: gs, result: 'removed' };
  }
  if (monsterCost(o.monsterId, ctx.monsters) > bagUsage(prev, ctx).free)
    return { state: prev, result: 'full' };
  gs.party.team = [...bag, uid];
  fixLead(gs);
  gs.updatedAt = now;
  return { state: gs, result: 'added' };
}

/** バトルで さいしょに出す仲間（せんとう）に する。バッグに いない 仲間は できない */
export function setLeader(prev: GameState, uid: string, now = Date.now()): GameState {
  const bag = bagMonsterUids(prev);
  if (!bag.includes(uid)) return prev;
  const gs = structuredClone(prev);
  gs.party.team = [uid, ...bag.filter((u) => u !== uid)];
  gs.party.activeUid = uid;
  gs.updatedAt = now;
  return gs;
}

/**
 * そうびを バッグに 入れる（＝そうびする）。同じ部位の そうびが 入っていれば 入れかえ（swapped。マスは かわらない）。
 * あいている マスが 無ければ full。そうびでない・もっていないなら none
 */
export function putEquip(
  prev: GameState,
  it: Item,
  ctx: BagContext,
  now = Date.now(),
): { state: GameState; result: BagMove; old?: string } {
  if (!isEquip(it) || (prev.inventory[it.id] ?? 0) <= 0) return { state: prev, result: 'none' };
  const old = prev.player.equipment[it.kind];
  if (!old && bagUsage(prev, ctx).free < 1) return { state: prev, result: 'full' };
  const next = equipItem(prev, it, now);
  if (!next) return { state: prev, result: 'none' };
  return old ? { state: next, result: 'swapped', old } : { state: next, result: 'added' };
}

/**
 * しんかすると ふえる マス（バッグの 外の 仲間は 0）と、バッグに 入りきるか。
 * 入りきらないときは しんかできない（先に ほかの ものを 出す）
 */
export function evolveRoom(gs: GameState, uid: string, ctx: BagContext): { extra: number; ok: boolean } {
  const o = gs.party.owned.find((x) => x.uid === uid);
  const to = o && ctx.monsters.get(o.monsterId)?.evolution?.to;
  if (!o || !to || !bagMonsterUids(gs).includes(uid)) return { extra: 0, ok: true };
  const extra = monsterCost(to, ctx.monsters) - monsterCost(o.monsterId, ctx.monsters);
  return { extra, ok: extra <= bagUsage(gs, ctx).free };
}

/** 仲間に なったばかりの モンスター：マスが あいていれば バッグへ、たりなければ あずける */
export function stowNewMonster(
  prev: GameState,
  uid: string,
  ctx: BagContext,
): { state: GameState; inBag: boolean } {
  const o = prev.party.owned.find((x) => x.uid === uid);
  if (!o || bagMonsterUids(prev).includes(uid)) return { state: prev, inBag: !!o };
  if (monsterCost(o.monsterId, ctx.monsters) > bagUsage(prev, ctx).free) return { state: prev, inBag: false };
  const gs = structuredClone(prev);
  gs.party.team = [...bagMonsterUids(prev), uid];
  fixLead(gs);
  return { state: gs, inBag: true };
}
