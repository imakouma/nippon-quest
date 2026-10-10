/**
 * 町の人の しごと（GDD §6）。純粋関数のみ。文言は持たない（画面側が ja.json の field.town* で文にする）。
 *  - おみせ：どうぐを かう（content の shop。無い県は その県の特産品）
 *  - やどや：とまると HP・MP が ぜんかい。負けたら ここに もどる（progress.lastInn）
 *  - かじや：レシピと ざいりょうで そうびを つくる
 *  - けいじばん：たのみごと（missions）を うけて、たっせいしたら ごほうび。無い県は モンスター退治などを 自動で用意
 *  - ずかんがかり：その県の めいしょ・とくさんを 見つけた数に おうじて ごほうび
 *  - まちの ひと：はじめて話すと、しごと（はなす 名所・特産品の しゅるい）に おうじた おみやげを くれる
 */
import type { Area, Item, Mission, Monster, Recipe, Reward } from '../content/schemas';
import type { GameState } from '../state/schema';
import { applyReward, type RewardLine } from './eventReward';
import { motifStamp } from './route';

export interface ShopEntry {
  itemId: string;
  price: number;
}

/** やどやの ねだん。おかねが たりなくても とめてくれる（おかねが無くて すすめなくならないように） */
export const INN_PRICE = 10;
/** 店の品数の上限（content の shop が無い県） */
const SHOP_MAX = 6;

function inventoryTotalAfterAdding(gs: GameState, itemId: string, n: number): number | null {
  const current = gs.inventory[itemId] ?? 0;
  const total = current + n;
  return Number.isSafeInteger(current) &&
    current >= 0 &&
    Number.isSafeInteger(n) &&
    n > 0 &&
    Number.isSafeInteger(total)
    ? total
    : null;
}

/** その県の 名産の たべもの（HP が かいふくする。名所・特産品の じゅんで さいしょの もの）。宝箱・おみやげに つかう */
export function localFood(area: Area | undefined, items: ReadonlyMap<string, Item>): Item | undefined {
  for (const m of area?.motifs ?? []) {
    const it = items.get(`${area!.id}-${m.id}`);
    if (it?.kind === 'consumable' && it.use?.heal) return it;
  }
  return undefined;
}

/** おみせの 品ぞろえ。content の area.shop があれば それ、無ければ その県の たべもの・そざい */
export function shopStock(area: Area, items: ReadonlyMap<string, Item>): ShopEntry[] {
  if (area.shop.length) return area.shop.filter((s) => items.has(s.itemId));
  const out: ShopEntry[] = [];
  for (const it of items.values()) {
    if (out.length >= SHOP_MAX) break;
    if (it.areaOrigin !== area.id || !it.price) continue;
    if (it.kind !== 'consumable' && it.kind !== 'material') continue;
    out.push({ itemId: it.id, price: it.price });
  }
  return out;
}

/** かう。おかねが たりなければ null */
export function buyItem(prev: GameState, e: ShopEntry, n = 1, now = Date.now()): GameState | null {
  if (!Number.isInteger(n) || n <= 0 || !Number.isSafeInteger(e.price) || e.price <= 0) return null;
  const cost = e.price * n;
  if (!Number.isSafeInteger(cost)) return null;
  if (prev.player.gold < cost) return null;
  const itemTotal = inventoryTotalAfterAdding(prev, e.itemId, n);
  if (itemTotal === null) return null;
  const gs = structuredClone(prev);
  gs.player.gold -= cost;
  gs.inventory[e.itemId] = itemTotal;
  if (!gs.dex.items.includes(e.itemId)) gs.dex.items.push(e.itemId);
  gs.updatedAt = now;
  return gs;
}

export function sellPrice(item: Pick<Item, 'kind' | 'price'>): number | null {
  if (item.kind === 'key' || !item.price || item.price <= 0) return null;
  return Math.max(1, Math.floor(item.price / 2));
}

/** うる。装備中の品は inventory から外れているため、所持している余剰品だけが対象になる。 */
export function sellItem(prev: GameState, item: Item, n = 1, now = Date.now()): GameState | null {
  const price = sellPrice(item);
  if (price === null || !Number.isInteger(n) || n <= 0 || (prev.inventory[item.id] ?? 0) < n) return null;
  const income = price * n;
  if (!Number.isSafeInteger(income) || !Number.isSafeInteger(prev.player.gold + income)) return null;
  const gs = structuredClone(prev);
  gs.inventory[item.id] = (gs.inventory[item.id] ?? 0) - n;
  gs.player.gold += income;
  gs.updatedAt = now;
  return gs;
}

/** やどやに とまる：HP・MP ぜんかい、ここを「さいごに とまった やどや」にする。paid＝はらった おかね */
export function innRest(
  prev: GameState,
  max: { hp: number; mp: number },
  inn: { map: string; x: number; y: number },
  price = INN_PRICE,
  now = Date.now(),
): { state: GameState; paid: number } {
  const gs = structuredClone(prev);
  const safePrice = Number.isInteger(price) && price >= 0 ? price : INN_PRICE;
  const paid = gs.player.gold >= safePrice ? safePrice : 0;
  gs.player.gold -= paid;
  gs.player.hp = max.hp;
  gs.player.mp = max.mp;
  gs.progress.lastInn = inn;
  gs.updatedAt = now;
  return { state: gs, paid };
}

// ───────────────────────── かじや ─────────────────────────

/** つくれる レシピ（はじめから ある ものと、手に入れた ものだけ） */
export function knownRecipes(recipes: Iterable<Recipe>, gs: GameState): Recipe[] {
  return [...recipes].filter((r) => r.unlockedByDefault || gs.progress.unlockedRecipes.includes(r.id));
}

function materialTotals(r: Recipe): Map<string, number> | null {
  const totals = new Map<string, number>();
  for (const material of r.materials) {
    const total = (totals.get(material.itemId) ?? 0) + material.n;
    if (!Number.isSafeInteger(total) || total <= 0) return null;
    totals.set(material.itemId, total);
  }
  return totals;
}

export function canCraft(gs: GameState, r: Recipe): boolean {
  const totals = materialTotals(r);
  return (
    totals !== null &&
    inventoryTotalAfterAdding(gs, r.result.itemId, r.result.n) !== null &&
    gs.player.gold >= r.gold &&
    [...totals].every(([itemId, n]) => (gs.inventory[itemId] ?? 0) >= n)
  );
}

/** ざいりょうと おかねを つかって つくる。たりなければ null */
export function craft(prev: GameState, r: Recipe, now = Date.now()): GameState | null {
  if (!canCraft(prev, r)) return null;
  const totals = materialTotals(r)!;
  const resultTotal = inventoryTotalAfterAdding(prev, r.result.itemId, r.result.n)!;
  const gs = structuredClone(prev);
  gs.player.gold -= r.gold;
  for (const [itemId, n] of totals) gs.inventory[itemId] = (gs.inventory[itemId] ?? 0) - n;
  gs.inventory[r.result.itemId] = resultTotal;
  if (!gs.dex.items.includes(r.result.itemId)) gs.dex.items.push(r.result.itemId);
  gs.updatedAt = now;
  return gs;
}

// ───────────────────────── けいじばん ─────────────────────────

export interface MissionTitles {
  defeat: (monster: string, n: number) => string;
  collect: (item: string, n: number) => string;
}

/**
 * けいじばんの たのみごと。content に missions が無い県は、その県の モンスター退治 2 つと
 * 特産品あつめ 1 つを 用意する（id は <県>-ms-auto-<n>）
 */
export function missionsFor(
  area: Area,
  monsters: ReadonlyMap<string, Monster>,
  items: ReadonlyMap<string, Item>,
  titles: MissionTitles,
): Mission[] {
  if (area.missions.length) return area.missions;
  const out: Mission[] = [];
  const giverNpc = 'npc_board';
  const foes = [
    ...new Set(
      area.encounters
        .filter((e) => e.zone === 'field')
        .flatMap((e) => e.table.map((x) => x.monsterId))
        .filter((id) => monsters.has(id) && !monsters.get(id)!.isBoss),
    ),
  ].slice(0, 2);
  foes.forEach((id, k) => {
    const n = 3 + k * 2;
    out.push({
      id: `${area.id}-ms-auto-${out.length + 1}`,
      title: titles.defeat(monsters.get(id)!.name, n),
      giverNpc,
      condition: `defeat:${id}:${n}`,
      reward: { gold: 40 + k * 30, xp: 20 + k * 20 },
    });
  });
  const food = [...items.values()].find(
    (it) =>
      it.areaOrigin === area.id &&
      it.kind === 'consumable' &&
      area.motifs.some((m) => it.id === `${area.id}-${m.id}`),
  );
  if (food)
    out.push({
      id: `${area.id}-ms-auto-${out.length + 1}`,
      title: titles.collect(food.name, 2),
      giverNpc,
      condition: `collect:${food.id}:2`,
      // ごほうびは おかね（むかしの やくそう 3 こぶんを 足した）
      reward: { gold: 100 },
    });
  return out;
}

export type MissionStatus = 'new' | 'accepted' | 'ready' | 'done';

/** condition の いまの数。defeat / perfect は うけたときの数（missions[id].progress）からの ふえた分 */
function conditionCount(gs: GameState, m: Mission, base: number): { have: number; need: number } {
  const [kind = '', target = '', nStr] = m.condition.split(':');
  const need = kind === 'event' || kind === 'recruit' ? 1 : Number(nStr ?? 1);
  const c = gs.progress.counters;
  switch (kind) {
    case 'defeat':
    case 'perfect':
      return { have: Math.max(0, (c[`${kind}:${target}`] ?? 0) - base), need };
    case 'collect':
      return { have: gs.inventory[target] ?? 0, need };
    case 'recruit':
      return { have: gs.party.owned.some((o) => o.monsterId === target) ? 1 : 0, need };
    case 'event':
      return { have: gs.progress.eventsDone.includes(target) ? 1 : 0, need };
    default:
      return { have: 0, need };
  }
}

export function missionProgress(gs: GameState, m: Mission): { have: number; need: number } {
  const rec = gs.progress.missions[m.id];
  const p = conditionCount(gs, m, rec?.progress ?? 0);
  return { have: Math.min(p.have, p.need), need: p.need };
}

export function missionStatus(gs: GameState, m: Mission): MissionStatus {
  const rec = gs.progress.missions[m.id];
  if (!rec) return 'new';
  if (rec.status === 'done') return 'done';
  const p = missionProgress(gs, m);
  return p.have >= p.need ? 'ready' : 'accepted';
}

/** たのみごとを うける。defeat / perfect は いまの数を おぼえておき、そこから かぞえる */
export function acceptMission(prev: GameState, m: Mission, now = Date.now()): GameState {
  if (prev.progress.missions[m.id]) return prev;
  const gs = structuredClone(prev);
  const [kind = '', target = ''] = m.condition.split(':');
  const base = kind === 'defeat' || kind === 'perfect' ? (gs.progress.counters[`${kind}:${target}`] ?? 0) : 0;
  gs.progress.missions[m.id] = { status: 'accepted', progress: base };
  gs.updatedAt = now;
  return gs;
}

/** たっせいを ほうこく：ごほうびを もらう。collect は あつめた どうぐを わたす。まだなら null */
export function completeMission(
  prev: GameState,
  m: Mission,
  now = Date.now(),
): { state: GameState; lines: RewardLine[] } | null {
  if (missionStatus(prev, m) !== 'ready') return null;
  const gs = structuredClone(prev);
  const [kind = '', target = '', nStr] = m.condition.split(':');
  if (kind === 'collect') gs.inventory[target] = Math.max(0, (gs.inventory[target] ?? 0) - Number(nStr ?? 1));
  const rec = gs.progress.missions[m.id]!;
  gs.progress.missions[m.id] = { ...rec, status: 'done' };
  return applyReward(gs, m.reward, now);
}

// ───────────────────────── まちの ひと・ずかんがかり ─────────────────────────

export const giftKey = (mapKey: string, npc: string): string => `gift:${mapKey}:${npc}`;

/** 町の人が はなす 名所・特産品（どれかは 名前の さいごの番号で決まる） */
export function villagerMotif(area: Area | undefined, npcName: string): Area['motifs'][number] | undefined {
  const motifs = area?.motifs ?? [];
  const k = Number(/\d+$/.exec(npcName)?.[0] ?? 0);
  return motifs.length ? motifs[(k * 7 + 3) % motifs.length] : undefined;
}

/**
 * 町の人の おみやげ（はじめて 話したとき 1 回だけ）。はなす モチーフの しゅるい＝その人の しごと で かわる：
 * たべもの・こうげいひん → その特産品 / めいしょ・しぜん → その県の 名産の たべもの 2 こ / まつり → おかね / れきし → けいけんち
 */
export function villagerGift(
  area: Area | undefined,
  npcName: string,
  items: ReadonlyMap<string, Item>,
): Reward {
  const motif = villagerMotif(area, npcName);
  const food = localFood(area, items);
  const snack: Reward = food ? { items: [{ itemId: food.id, n: 2 }] } : { gold: 20 };
  if (!motif || !area) return snack;
  const own = `${area.id}-${motif.id}`;
  switch (motif.kind) {
    case 'food':
    case 'craft':
      return items.has(own) ? { items: [{ itemId: own, n: 1 }] } : snack;
    case 'festival':
      return { gold: 30 };
    case 'history':
      return { xp: 30 };
    default:
      return snack;
  }
}

/** ずかんがかりの ごほうび：その県の めいしょ・とくさんを DEX_STEP こ 見つけるごとに 1 だん */
export const DEX_STEP = 3;
export const dexRewardKey = (areaId: string): string => `dexReward:${areaId}`;

export function dexProgress(
  gs: GameState,
  area: Area,
): { found: number; total: number; tiers: number; claimed: number } {
  const total = area.motifs.length;
  const found = area.motifs.filter((m) => gs.dex.motifs.includes(motifStamp(area.id, m.id))).length;
  return {
    found,
    total,
    tiers: Math.floor(found / DEX_STEP) + (found === total && total % DEX_STEP ? 1 : 0),
    claimed: gs.progress.counters[dexRewardKey(area.id)] ?? 0,
  };
}

/** まだ もらっていない だんの ごほうびを まとめて もらう。1 だん＝おかね 30・けいけんち 30 */
export function claimDexReward(
  prev: GameState,
  area: Area,
  now = Date.now(),
): { state: GameState; lines: RewardLine[] } | null {
  const p = dexProgress(prev, area);
  const n = p.tiers - p.claimed;
  if (n <= 0) return null;
  const applied = applyReward(prev, { gold: 30 * n, xp: 30 * n }, now);
  applied.state.progress.counters[dexRewardKey(area.id)] = p.tiers;
  return applied;
}
