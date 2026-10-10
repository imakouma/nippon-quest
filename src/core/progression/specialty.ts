/**
 * 特産品（県の motif のうち kind が food・craft で、content/items に <県>-<motif id> のどうぐがあるもの）。純粋関数のみ。
 * 特産品は フィールドの宝箱のほか、その県のモンスターを たおしたときの ドロップでも 手に入る。
 */
import type { Area, Item, Monster, Motif, Stats } from '../content/schemas';
import type { GameState } from '../state/schema';
import { motifStamp } from './route';

/** 県の特産品を全部見つけたときに得る、全能力の永久上昇率。 */
export const SPECIALTY_AREA_BONUS_RATE = 0.05;

export interface SpecialtyAreaProgress {
  found: number;
  total: number;
  rate: number;
  complete: boolean;
}

export interface SpecialtyTreasureBonus {
  found: number;
  total: number;
  rate: number;
  completedAreas: number;
  byArea: ReadonlyMap<string, SpecialtyAreaProgress>;
}

export interface SpecialtyTreasureGain extends SpecialtyAreaProgress {
  areaId: string;
  areaName: string;
  gainRate: number;
  totalRate: number;
}

export interface Specialty {
  item: Item;
  motif: Motif;
}

/** その県の特産品（どうぐ と、説明を持つ motif） */
export function specialtiesOf(area: Area, items: ReadonlyMap<string, Item>): Specialty[] {
  return area.motifs.flatMap((motif) => {
    if (motif.kind !== 'food' && motif.kind !== 'craft') return [];
    const item = items.get(`${area.id}-${motif.id}`);
    return item ? [{ item, motif }] : [];
  });
}

/** どうぐの id → 特産品（どの県のどの motif か）。ドロップしたときに説明を出すのに使う */
export function specialtyIndex(
  areas: ReadonlyMap<string, Area>,
  items: ReadonlyMap<string, Item>,
): Map<string, Specialty> {
  const out = new Map<string, Specialty>();
  for (const area of areas.values()) for (const s of specialtiesOf(area, items)) out.set(s.item.id, s);
  return out;
}

/** 一度でも図鑑に登録した特産品。所持数ではなく発見記録を見るため、使っても効果は消えない。 */
export function specialtyKnown(gs: GameState, areaId: string, motifId: string, itemId: string): boolean {
  return gs.dex.motifs.includes(motifStamp(areaId, motifId)) || gs.dex.items.includes(itemId);
}

/**
 * 特産品の「お宝パワー」。県ごとに最大 +5% で、途中でも集めた割合ぶん全能力へ効く。
 * 同じ品を何個持っていても図鑑登録は1回なので重複しない。
 */
export function specialtyTreasureBonus(
  gs: GameState,
  areas: ReadonlyMap<string, Area>,
  items: ReadonlyMap<string, Item>,
): SpecialtyTreasureBonus {
  let found = 0;
  let total = 0;
  let rate = 0;
  let completedAreas = 0;
  const byArea = new Map<string, SpecialtyAreaProgress>();

  for (const area of areas.values()) {
    const specialties = specialtiesOf(area, items);
    if (!specialties.length) continue;
    const areaFound = specialties.filter(({ item, motif }) =>
      specialtyKnown(gs, area.id, motif.id, item.id),
    ).length;
    const areaRate = SPECIALTY_AREA_BONUS_RATE * (areaFound / specialties.length);
    const complete = areaFound === specialties.length;
    found += areaFound;
    total += specialties.length;
    rate += areaRate;
    if (complete) completedAreas++;
    byArea.set(area.id, { found: areaFound, total: specialties.length, rate: areaRate, complete });
  }

  return { found, total, rate, completedAreas, byArea };
}

/** 初回発見で増えるお宝パワー。すでに発見済み、または特産品でなければ null。 */
export function specialtyTreasureGain(
  gs: GameState,
  itemId: string,
  areas: ReadonlyMap<string, Area>,
  items: ReadonlyMap<string, Item>,
): SpecialtyTreasureGain | null {
  for (const area of areas.values()) {
    const specialties = specialtiesOf(area, items);
    const specialty = specialties.find(({ item }) => item.id === itemId);
    if (!specialty || specialtyKnown(gs, area.id, specialty.motif.id, itemId)) continue;
    const before = specialtyTreasureBonus(gs, areas, items);
    const areaBefore = before.byArea.get(area.id)!;
    const gainRate = SPECIALTY_AREA_BONUS_RATE / areaBefore.total;
    const found = areaBefore.found + 1;
    return {
      areaId: area.id,
      areaName: area.name,
      found,
      total: areaBefore.total,
      rate: areaBefore.rate + gainRate,
      complete: found === areaBefore.total,
      gainRate,
      totalRate: before.rate + gainRate,
    };
  }
  return null;
}

/** 戦闘用能力へ、お宝パワーをまとめて反映する。 */
export function applySpecialtyTreasureBonus(stats: Stats, bonus: SpecialtyTreasureBonus): Stats {
  const multiply = (value: number) => {
    const powered = value * (1 + bonus.rate);
    return bonus.rate > 0 ? Math.max(value + 1, Math.round(powered)) : value;
  };
  return {
    hp: multiply(stats.hp),
    mp: multiply(stats.mp),
    scienceAtk: multiply(stats.scienceAtk),
    humanitiesAtk: multiply(stats.humanitiesAtk),
    scienceDef: multiply(stats.scienceDef),
    humanitiesDef: multiply(stats.humanitiesDef),
    spd: multiply(stats.spd),
    wis: multiply(stats.wis),
  };
}

/**
 * モンスターのドロップに、そのモンスターの県の特産品を足した monsters を返す（元の Map は書き換えない）。
 * 合わせて rate の確率（1 つあたり rate / 特産品の数）。もともとドロップにある特産品は そのまま（二重にしない）。
 * 地方ボス（area が島の id）は県が無いので足さない。
 */
export function withSpecialtyDrops(
  monsters: ReadonlyMap<string, Monster>,
  areas: ReadonlyMap<string, Area>,
  items: ReadonlyMap<string, Item>,
  rate: number,
): Map<string, Monster> {
  const out = new Map<string, Monster>();
  for (const [id, m] of monsters) {
    const area = areas.get(m.area);
    const list = area
      ? specialtiesOf(area, items).filter((s) => !m.drops.some((d) => d.itemId === s.item.id))
      : [];
    if (!list.length || rate <= 0) {
      out.set(id, m);
      continue;
    }
    const each = Math.round((rate / list.length) * 1000) / 1000;
    out.set(id, { ...m, drops: [...m.drops, ...list.map((s) => ({ itemId: s.item.id, rate: each }))] });
  }
  return out;
}
