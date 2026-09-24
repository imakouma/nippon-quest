/**
 * content のデータ（Monster / Item / EquipSet）から Combatant / Party を組み立てる。
 * 装備・セットボーナス込みの「実効ステータス」はここで確定する。
 */
import type { Element, EquipSet, Item, Monster, Stats } from '../content/schemas';
import type { Combatant, Party } from './types';

export interface HeroSpec {
  name: string;
  level: number;
  baseStats: Stats;
  growth: { hp: number; mp: number; atk: number; def: number; spd: number; wis: number };
  skills: string[];
  equipment: Partial<Record<'weapon' | 'head' | 'chest' | 'legs' | 'feet', string>>;
  /** 学習で伸びた かしこさ の上乗せ（GDD §4.2） */
  bonusWis?: number;
}

export function statsAtLevel(base: Stats, growth: HeroSpec['growth'], level: number): Stats {
  const n = level - 1;
  return {
    hp: Math.round(base.hp + growth.hp * n),
    mp: Math.round(base.mp + growth.mp * n),
    atk: Math.round((base.atk + growth.atk * n) * 10) / 10,
    def: Math.round((base.def + growth.def * n) * 10) / 10,
    spd: Math.round((base.spd + growth.spd * n) * 10) / 10,
    wis: Math.round((base.wis + growth.wis * n) * 10) / 10,
  };
}

export interface EquipResult {
  stats: Stats;
  grantedSkills: string[];
  elementBoost: Partial<Record<Element, number>>;
  setComplete: string | null;
}

export function applyEquipment(
  base: Stats,
  equipment: HeroSpec['equipment'],
  items: Map<string, Item>,
  sets: Map<string, EquipSet>,
): EquipResult {
  const stats: Stats = { ...base };
  const grantedSkills: string[] = [];
  const elementBoost: Partial<Record<Element, number>> = {};
  const equipped = Object.values(equipment).filter((x): x is string => !!x);

  for (const id of equipped) {
    const it = items.get(id);
    if (!it) continue;
    for (const [k, v] of Object.entries(it.stats ?? {})) stats[k as keyof Stats] += v as number;
    if (it.grantsSkill) grantedSkills.push(it.grantsSkill);
  }

  let setComplete: string | null = null;
  for (const set of sets.values()) {
    if (set.pieces.every((p) => equipped.includes(p))) {
      setComplete = set.id;
      for (const [k, v] of Object.entries(set.bonus.stats ?? {})) stats[k as keyof Stats] += v as number;
      for (const b of set.bonus.elementBoost ?? [])
        elementBoost[b.element] = (elementBoost[b.element] ?? 1) * b.multiplier;
    }
  }
  return { stats, grantedSkills, elementBoost, setComplete };
}

export function makeHero(spec: HeroSpec, items: Map<string, Item>, sets: Map<string, EquipSet>): Combatant {
  const leveled = statsAtLevel(spec.baseStats, spec.growth, spec.level);
  leveled.wis += spec.bonusWis ?? 0;
  const eq = applyEquipment(leveled, spec.equipment, items, sets);
  return {
    id: 'hero',
    refId: 'hero',
    name: spec.name,
    isHero: true,
    level: spec.level,
    element: 'none',
    weaknessRevealed: false,
    stats: eq.stats,
    hp: eq.stats.hp,
    mp: eq.stats.mp,
    skills: [...new Set([...spec.skills, ...eq.grantedSkills])],
    buffs: {},
    isBoss: false,
    phaseIndex: -1,
    actionsPerTurn: 1,
    elementBoost: eq.elementBoost,
  };
}

export function makeMonster(def: Monster, level: number, instanceId = `${def.id}#${level}`): Combatant {
  const stats = statsAtLevel(def.baseStats, def.growth, level);
  return {
    id: instanceId,
    refId: def.id,
    name: def.name,
    isHero: false,
    level,
    element: def.element,
    weakness: def.weakness,
    weaknessRevealed: false,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    skills: [...def.skills],
    buffs: {},
    isBoss: def.isBoss,
    phaseIndex: -1,
    actionsPerTurn: 1,
  };
}

export function makeParty(hero: Combatant, monsters: Combatant[], items: Record<string, number> = {}): Party {
  return { hero, monsters, activeMonsterIndex: 0, items };
}
