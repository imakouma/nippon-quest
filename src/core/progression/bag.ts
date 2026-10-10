/**
 * 2Dバッグ編成。
 * 主人公・仲間・装備をグリッドへ置き、バッグ外の仲間は控えとして戦闘中に交代できる。
 */
import type { ContentIndex } from '../content/loader';
import type { Item, Monster, Settings, Stats } from '../content/schemas';
import type { GameState } from '../state/schema';
import { STARTER_EQUIPMENT_ID } from '../state/starter';
import { EQUIP_SLOTS, equipItem, isEquip } from './inventory';

export type BagSettings = Settings['bag'];
export interface BagSize {
  w: number;
  h: number;
}
export interface BagPos {
  x: number;
  y: number;
  rotated?: boolean;
}
export interface BagContext {
  monsters: ReadonlyMap<string, Monster>;
  cols: number;
  rows: number;
  capacity: number;
}

export const MAX_FORMATION_CHARACTERS = 8;
export const MAX_COMPANIONS = MAX_FORMATION_CHARACTERS - 1;

/** 最初から 3x3。東北クリア後は装備の置き場も含めて 4x3 へ広がる。 */
export function bagDimensions(gs: Pick<GameState, 'progress'>): BagSize {
  const n = gs.progress.islandsCleared.length;
  return n >= 1 ? { w: 4, h: 3 } : { w: 3, h: 3 };
}

/** 第一章を終えるまでは、主人公とマナビモノの配置だけを覚える。 */
export const equipmentUnlocked = (gs: Pick<GameState, 'progress'>): boolean =>
  gs.progress.islandsCleared.includes('tohoku');

/** 旧API互換。レベルではなくストーリー進行へ移行したため設定上の最大値だけを返す。 */
export function bagCapacity(_level: number, cfg: BagSettings): number {
  return Math.min(12, cfg.maxSlots);
}
export function slotUnlockLevel(_i: number, _cfg: BagSettings): number {
  return 1;
}
export function nextSlotLevel(_level: number, _cfg: BagSettings): number | null {
  return null;
}

export function bagContext(gs: GameState, c: Pick<ContentIndex, 'monsters'>): BagContext {
  const { w, h } = bagDimensions(gs);
  return { monsters: c.monsters, cols: w, rows: h, capacity: w * h };
}

const stageMemo = new WeakMap<ReadonlyMap<string, Monster>, Map<string, number>>();
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

/** 通常キャラは進化段階ぶん横に使い、仲間になったボスは2x2。 */
export function monsterSize(monsterId: string, monsters: ReadonlyMap<string, Monster>): BagSize {
  return monsters.get(monsterId)?.isBoss ? { w: 2, h: 2 } : { w: evolutionStage(monsterId, monsters), h: 1 };
}
export function monsterCost(monsterId: string, monsters: ReadonlyMap<string, Monster>): number {
  const s = monsterSize(monsterId, monsters);
  return s.w * s.h;
}

const monKey = (uid: string) => `mon:${uid}`;
const equipKey = (kind: string) => `eq:${kind}`;

const EQUIP_OFFSET: Readonly<Record<(typeof EQUIP_SLOTS)[number], readonly [number, number]>> = {
  head: [0, -1],
  weapon: [1, 0],
  chest: [-1, 0],
  legs: [-1, 1],
  feet: [1, 1],
};

export function equipPosition(gs: GameState, kind: (typeof EQUIP_SLOTS)[number]): BagPos {
  const hero = gs.party.bagPlacements.hero ?? { x: 1, y: 1 };
  const [dx, dy] = EQUIP_OFFSET[kind];
  return { x: hero.x + dx, y: hero.y + dy, rotated: false };
}

/** 解放済みで、決められた隣接マスに置かれている装備だけを能力と見た目へ反映する。 */
export function activeEquipment(gs: GameState): GameState['player']['equipment'] {
  const result: GameState['player']['equipment'] = {};
  for (const kind of EQUIP_SLOTS) {
    const id = gs.player.equipment[kind];
    if (!equipmentUnlocked(gs) && id !== STARTER_EQUIPMENT_ID) continue;
    const at = gs.party.bagPlacements[equipKey(kind)];
    const expected = equipPosition(gs, kind);
    if (id && at?.x === expected.x && at.y === expected.y) result[kind] = id;
  }
  return result;
}

export function bagMonsterUids(gs: GameState): string[] {
  const owned = new Set(gs.party.owned.map((o) => o.uid));
  const placed = [
    ...new Set(gs.party.team.filter((uid) => owned.has(uid) && !!gs.party.bagPlacements[monKey(uid)])),
  ];
  const lead = gs.party.activeUid;
  return lead && placed.includes(lead) ? [lead, ...placed.filter((u) => u !== lead)] : placed;
}

export function reserveMonsterUids(gs: GameState): string[] {
  const owned = new Set(gs.party.owned.map((o) => o.uid));
  return [...new Set(gs.party.reserve.filter((uid) => owned.has(uid) && !gs.party.team.includes(uid)))];
}

/** バッグ内＋控え。主人公と合わせて最大8体。 */
export function battleRosterUids(gs: GameState): string[] {
  return [...bagMonsterUids(gs), ...reserveMonsterUids(gs)].slice(0, MAX_COMPANIONS);
}

function thingSize(gs: GameState, key: string, ctx: BagContext): BagSize | null {
  if (key === 'hero') return { w: 1, h: 1 };
  if (key.startsWith('eq:'))
    return EQUIP_SLOTS.includes(key.slice(3) as (typeof EQUIP_SLOTS)[number]) ? { w: 1, h: 1 } : null;
  if (!key.startsWith('mon:')) return null;
  const o = gs.party.owned.find((x) => x.uid === key.slice(4));
  return o ? monsterSize(o.monsterId, ctx.monsters) : null;
}

function cellsAt(pos: BagPos, size: BagSize): string[] {
  const w = pos.rotated ? size.h : size.w;
  const h = pos.rotated ? size.w : size.h;
  return Array.from({ length: h }, (_, dy) =>
    Array.from({ length: w }, (_x, dx) => `${pos.x + dx},${pos.y + dy}`),
  ).flat();
}

export function canPlace(gs: GameState, key: string, pos: BagPos, ctx: BagContext): boolean {
  if (!Number.isSafeInteger(pos.x) || !Number.isSafeInteger(pos.y)) return false;
  const size = thingSize(gs, key, ctx);
  if (!size) return false;
  if (key.startsWith('eq:')) {
    const kind = key.slice(3) as (typeof EQUIP_SLOTS)[number];
    const starter = gs.player.equipment[kind] === STARTER_EQUIPMENT_ID;
    if ((!equipmentUnlocked(gs) && !starter) || !EQUIP_SLOTS.includes(kind)) return false;
  }
  const mine = cellsAt(pos, size);
  if (
    mine.some((c) => {
      const [x, y] = c.split(',').map(Number);
      return x! < 0 || y! < 0 || x! >= ctx.cols || y! >= ctx.rows;
    })
  )
    return false;
  const occupied = new Set<string>();
  for (const [other, at] of Object.entries(gs.party.bagPlacements)) {
    if (other === key) continue;
    const os = thingSize(gs, other, ctx);
    if (os) for (const c of cellsAt(at, os)) occupied.add(c);
  }
  return mine.every((c) => !occupied.has(c));
}

export function firstFreePosition(gs: GameState, key: string, ctx: BagContext): BagPos | null {
  for (let y = 0; y < ctx.rows; y++)
    for (let x = 0; x < ctx.cols; x++) {
      const p = { x, y, rotated: false };
      if (canPlace(gs, key, p, ctx)) return p;
    }
  return null;
}

export function moveBagThing(
  prev: GameState,
  key: string,
  pos: BagPos,
  ctx: BagContext,
  now = Date.now(),
): GameState | null {
  if (!Object.hasOwn(prev.party.bagPlacements, key)) return null;
  if (!canPlace(prev, key, pos, ctx)) return null;
  const gs = structuredClone(prev);
  gs.party.bagPlacements[key] = { x: pos.x, y: pos.y, rotated: !!pos.rotated };
  gs.updatedAt = now;
  return gs;
}

export interface BagUsage {
  used: number;
  capacity: number;
  free: number;
  over: boolean;
}
export function bagUsage(gs: GameState, ctx: BagContext): BagUsage {
  let used = 0;
  let invalid = false;
  const occupied = new Set<string>();
  for (const [key, pos] of Object.entries(gs.party.bagPlacements)) {
    const s = thingSize(gs, key, ctx);
    if (!s) continue;
    used += s.w * s.h;
    for (const cell of cellsAt(pos, s)) {
      const [x, y] = cell.split(',').map(Number);
      if (x! < 0 || y! < 0 || x! >= ctx.cols || y! >= ctx.rows || occupied.has(cell)) invalid = true;
      occupied.add(cell);
    }
  }
  return {
    used,
    capacity: ctx.capacity,
    free: Math.max(0, ctx.capacity - used),
    over: invalid || used > ctx.capacity,
  };
}

export type BagMove = 'added' | 'removed' | 'benched' | 'swapped' | 'full' | 'roster-full' | 'none';
function fixLead(gs: GameState): void {
  const roster = battleRosterUids(gs);
  if (!gs.party.activeUid || !roster.includes(gs.party.activeUid)) gs.party.activeUid = roster[0] ?? null;
}

/** バッグ内⇄控え。未編成の仲間は空きがあれば編成にも追加する。 */
export function toggleBagMonster(
  prev: GameState,
  uid: string,
  ctx: BagContext,
  now = Date.now(),
): { state: GameState; result: BagMove } {
  if (!prev.party.owned.some((x) => x.uid === uid)) return { state: prev, result: 'none' };
  const key = monKey(uid);
  const gs = structuredClone(prev);
  if (gs.party.team.includes(uid)) {
    gs.party.team = gs.party.team.filter((u) => u !== uid);
    delete gs.party.bagPlacements[key];
    if (!gs.party.reserve.includes(uid)) gs.party.reserve.push(uid);
    if (gs.party.activeUid === uid) gs.party.activeUid = gs.party.team[0] ?? gs.party.reserve[0] ?? null;
    fixLead(gs);
    gs.updatedAt = now;
    return { state: gs, result: 'removed' };
  }
  const roster = battleRosterUids(prev);
  if (!roster.includes(uid) && roster.length >= MAX_COMPANIONS) return { state: prev, result: 'roster-full' };
  const at = firstFreePosition(prev, key, ctx);
  if (!at) {
    if (!roster.includes(uid)) {
      gs.party.reserve.push(uid);
      fixLead(gs);
      gs.updatedAt = now;
      return { state: gs, result: 'benched' };
    }
    return { state: prev, result: 'full' };
  }
  gs.party.reserve = gs.party.reserve.filter((u) => u !== uid);
  gs.party.team.push(uid);
  gs.party.bagPlacements[key] = { ...at, rotated: !!at.rotated };
  fixLead(gs);
  gs.updatedAt = now;
  return { state: gs, result: 'added' };
}

export function removeFromRoster(prev: GameState, uid: string, now = Date.now()): GameState {
  if (!prev.party.reserve.includes(uid)) return prev;
  const gs = structuredClone(prev);
  gs.party.reserve = gs.party.reserve.filter((u) => u !== uid);
  fixLead(gs);
  gs.updatedAt = now;
  return gs;
}

export function setLeader(prev: GameState, uid: string, now = Date.now()): GameState {
  if (!battleRosterUids(prev).includes(uid)) return prev;
  const gs = structuredClone(prev);
  gs.party.activeUid = uid;
  gs.updatedAt = now;
  return gs;
}

/** 消耗品をバトルへ持ち込むバッグに入れる／出す。個数は inventory 側で管理する。 */
export function toggleBattleItem(prev: GameState, item: Item, now = Date.now()): GameState {
  if (item.kind !== 'consumable' || !item.use || (prev.inventory[item.id] ?? 0) <= 0) return prev;
  const gs = structuredClone(prev);
  gs.party.bagItems = gs.party.bagItems.includes(item.id)
    ? gs.party.bagItems.filter((id) => id !== item.id)
    : [...gs.party.bagItems, item.id];
  gs.updatedAt = now;
  return gs;
}

export function putEquip(
  prev: GameState,
  it: Item,
  ctx: BagContext,
  now = Date.now(),
): { state: GameState; result: BagMove; old?: string } {
  if (
    (!equipmentUnlocked(prev) && it.id !== STARTER_EQUIPMENT_ID) ||
    !isEquip(it) ||
    (prev.inventory[it.id] ?? 0) <= 0
  )
    return { state: prev, result: 'none' };
  const old = prev.player.equipment[it.kind];
  const key = equipKey(it.kind);
  const at = equipPosition(prev, it.kind);
  const next = equipItem(prev, it, now);
  if (!next) return { state: prev, result: 'none' };
  if (!canPlace(next, key, at, ctx)) return { state: prev, result: 'full' };
  next.party.bagPlacements[key] = { ...at, rotated: !!at.rotated };
  return old ? { state: next, result: 'swapped', old } : { state: next, result: 'added' };
}

export function evolveRoom(gs: GameState, uid: string, ctx: BagContext): { extra: number; ok: boolean } {
  const owned = gs.party.owned.find((monster) => monster.uid === uid);
  const nextId = owned && ctx.monsters.get(owned.monsterId)?.evolution?.to;
  if (!owned || !nextId || !ctx.monsters.has(nextId)) return { extra: 0, ok: false };
  const extra = Math.max(0, monsterCost(nextId, ctx.monsters) - monsterCost(owned.monsterId, ctx.monsters));
  const key = monKey(uid);
  const at = gs.party.bagPlacements[key];
  if (!at) return { extra, ok: true };
  const evolved = structuredClone(gs);
  evolved.party.owned.find((monster) => monster.uid === uid)!.monsterId = nextId;
  return { extra, ok: canPlace(evolved, key, at, ctx) };
}

export function stowNewMonster(
  prev: GameState,
  uid: string,
  ctx: BagContext,
  now = Date.now(),
): { state: GameState; inBag: boolean } {
  if (!prev.party.owned.some((monster) => monster.uid === uid)) return { state: prev, inBag: false };
  if (battleRosterUids(prev).includes(uid))
    return {
      state: prev,
      inBag: prev.party.team.includes(uid) && !!prev.party.bagPlacements[monKey(uid)],
    };
  if (battleRosterUids(prev).length >= MAX_COMPANIONS) return { state: prev, inBag: false };
  const placed = toggleBagMonster(prev, uid, ctx, now);
  if (placed.result === 'added') return { state: placed.state, inBag: true };
  const gs = structuredClone(prev);
  if (!gs.party.reserve.includes(uid)) gs.party.reserve.push(uid);
  fixLead(gs);
  gs.updatedAt = now;
  return { state: gs, inBag: false };
}

export interface AdjacencyBonus {
  stats: Partial<Stats>;
  labels: string[];
}
/** 主人公に上下左右で隣接した仲間が、属性ごとに5%の支援効果を与える。 */
export function adjacencyBonus(gs: GameState, ctx: BagContext, base: Stats): AdjacencyBonus {
  const hero = gs.party.bagPlacements.hero ?? { x: 1, y: 1 };
  const stats: Partial<Stats> = {};
  const labels: string[] = [];
  const map: Record<string, keyof Stats> = {
    hino: 'scienceAtk',
    mizu: 'scienceDef',
    mori: 'hp',
    tsuchi: 'humanitiesDef',
    kaze: 'spd',
    hikari: 'wis',
    yami: 'humanitiesAtk',
    none: 'hp',
  };
  for (const uid of bagMonsterUids(gs)) {
    const p = gs.party.bagPlacements[monKey(uid)];
    const o = gs.party.owned.find((x) => x.uid === uid);
    const def = o && ctx.monsters.get(o.monsterId);
    if (!p || !def) continue;
    const adjacent = cellsAt(p, monsterSize(def.id, ctx.monsters)).some((cell) => {
      const [x, y] = cell.split(',').map(Number);
      return Math.abs(x! - hero.x) + Math.abs(y! - hero.y) === 1;
    });
    if (!adjacent) continue;
    const stat = map[def.element]!;
    stats[stat] = (stats[stat] ?? 0) + Math.max(1, Math.round(base[stat] * 0.05));
    labels.push(`${def.name} → ${stat.toUpperCase()} +5%`);
  }
  return { stats, labels };
}
