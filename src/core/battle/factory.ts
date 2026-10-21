/**
 * content のデータ（Monster / Item / EquipSet）から Combatant / Party を組み立てる。
 * 装備・セットボーナス込みの「実効ステータス」はここで確定する。
 */
import type { Element, EquipSet, GrowthCurve, Item, Monster, Stats } from '../content/schemas';
import type { Combatant, Party } from './types';

export interface HeroSpec {
  name: string;
  level: number;
  baseStats: Stats | LegacyStats;
  growth: GrowthCurve | LegacyGrowth;
  skills: string[];
  equipment: Partial<Record<'weapon' | 'head' | 'chest' | 'legs' | 'feet', string>>;
  /** 学習で伸びた かしこさ の上乗せ（GDD §4.2） */
  bonusWis?: number;
  /** Lv101以降の成長倍率。主人公のやり込み帯だけに使う。 */
  post100GrowthRate?: number;
}

type LegacyGrowth = { hp: number; mp: number; atk: number; def: number; spd: number; wis: number };
type LegacyStats = { hp: number; mp: number; atk: number; def: number; spd: number; wis: number };

const STAT_KEYS = [
  'hp',
  'mp',
  'scienceAtk',
  'humanitiesAtk',
  'scienceDef',
  'humanitiesDef',
  'spd',
  'wis',
] as const;

function integerStats(stats: Stats): Stats {
  return Object.fromEntries(STAT_KEYS.map((key) => [key, Math.round(stats[key])])) as Stats;
}

function normalizedGrowth(growth: GrowthCurve | LegacyGrowth): GrowthCurve {
  if ('base' in growth) return growth;
  const base = {
    hp: growth.hp,
    mp: growth.mp,
    scienceAtk: growth.atk,
    humanitiesAtk: growth.atk,
    scienceDef: growth.def,
    humanitiesDef: growth.def,
    spd: growth.spd,
    wis: growth.wis,
  };
  const zero = Object.fromEntries(STAT_KEYS.map((key) => [key, 0])) as Stats;
  return { base, every5: zero, every10: zero };
}

export function statsAtLevel(
  base: Stats | LegacyStats,
  growthInput: HeroSpec['growth'],
  level: number,
  post100GrowthRate = 1,
): Stats {
  const growth = normalizedGrowth(growthInput);
  const legacy = base as Stats & Partial<LegacyStats>;
  const normalizedBase: Stats =
    legacy.scienceAtk === undefined
      ? {
          hp: legacy.hp,
          mp: legacy.mp,
          scienceAtk: legacy.atk ?? 0,
          humanitiesAtk: legacy.atk ?? 0,
          scienceDef: legacy.def ?? 0,
          humanitiesDef: legacy.def ?? 0,
          spd: legacy.spd,
          wis: legacy.wis,
        }
      : (base as Stats);
  const n = Math.max(0, level - 1);
  const minor = Math.floor(level / 5);
  const major = Math.floor(level / 10);
  const normalLevels = Math.min(n, 99);
  const post100Levels = Math.max(0, n - normalLevels);
  const normalMinor = Math.min(minor, 20);
  const post100Minor = Math.max(0, minor - normalMinor);
  const normalMajor = Math.min(major, 10);
  const post100Major = Math.max(0, major - normalMajor);
  return Object.fromEntries(
    STAT_KEYS.map((key) => [
      key,
      Math.floor(
        normalizedBase[key] +
          growth.base[key] * normalLevels +
          growth.every5[key] * normalMinor +
          growth.every10[key] * normalMajor +
          post100GrowthRate *
            (growth.base[key] * post100Levels +
              growth.every5[key] * post100Minor +
              growth.every10[key] * post100Major),
      ),
    ]),
  ) as Stats;
}

export interface EquipResult {
  stats: Stats;
  grantedSkills: string[];
  elementBoost: Partial<Record<Element, number>>;
  attackElement: Element;
  elementResists: Element[];
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
  let attackElement: Element = 'none';
  const elementResists = new Set<Element>();
  const equipped: string[] = [];

  for (const [slot, id] of Object.entries(equipment)) {
    if (!id) continue;
    const it = items.get(id);
    if (!it || it.kind !== slot) continue;
    equipped.push(id);
    for (const [k, v] of Object.entries(it.stats ?? {}))
      if (typeof v === 'number') stats[k as keyof Stats] += v;
    if (it.grantsSkill) grantedSkills.push(it.grantsSkill);
    if (it.element && it.kind === 'weapon') attackElement = it.element;
    else if (it.element) elementResists.add(it.element);
  }

  let setComplete: string | null = null;
  for (const set of sets.values()) {
    if (set.pieces.every((p) => equipped.includes(p))) {
      setComplete = set.id;
      for (const [k, v] of Object.entries(set.bonus.stats ?? {}))
        if (typeof v === 'number') stats[k as keyof Stats] += v;
      for (const b of set.bonus.elementBoost ?? [])
        elementBoost[b.element] = (elementBoost[b.element] ?? 1) * b.multiplier;
    }
  }
  return {
    stats,
    grantedSkills,
    elementBoost,
    attackElement,
    elementResists: [...elementResists],
    setComplete,
  };
}

export function makeHero(spec: HeroSpec, items: Map<string, Item>, sets: Map<string, EquipSet>): Combatant {
  const leveled = statsAtLevel(spec.baseStats, spec.growth, spec.level, spec.post100GrowthRate);
  leveled.wis += spec.bonusWis ?? 0;
  const eq = applyEquipment(leveled, spec.equipment, items, sets);
  const stats = integerStats(eq.stats);
  return {
    id: 'hero',
    refId: 'hero',
    name: spec.name,
    isHero: true,
    level: spec.level,
    element: eq.attackElement,
    weaknessRevealed: false,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    skills: [...new Set([...spec.skills, ...eq.grantedSkills])],
    buffs: {},
    isBoss: false,
    phaseIndex: -1,
    actionsPerTurn: 1,
    elementBoost: eq.elementBoost,
    elementResists: eq.elementResists,
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
    subjectAffinity: def.subjectAffinity,
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
