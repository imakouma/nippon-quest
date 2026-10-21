export function scaleStat(value: unknown, factor: number, minimumOne: boolean): unknown {
  if (typeof value !== 'number') return value;
  const scaled = Math.round(value * factor * 10) / 10;
  return minimumOne ? Math.max(value > 0 ? 1 : 0, scaled) : Math.max(0, scaled);
}

/** Lv50までの総成長量から、5・10レベル節目で加える分を差し引いた基礎成長。 */
export function scaleGrowth(value: unknown, factor: number, milestoneTotalAt50: number): unknown {
  if (typeof value !== 'number') return value;
  return Math.max(0, Math.round((value * factor - milestoneTotalAt50 / 49) * 10) / 10);
}

function academic(object: Record<string, unknown>, minimumOne: boolean): boolean {
  if (!('atk' in object) && !('def' in object)) return false;
  const atk = scaleStat(object.atk, 0.625, minimumOne);
  const def = scaleStat(object.def, 2 / 3, minimumOne);
  if (atk !== undefined) {
    object.scienceAtk = atk;
    object.humanitiesAtk = atk;
    delete object.atk;
  }
  if (def !== undefined) {
    object.scienceDef = def;
    object.humanitiesDef = def;
    delete object.def;
  }
  return true;
}

export function migrateAcademicValue(value: unknown, parentKey = ''): number {
  if (Array.isArray(value))
    return value.reduce((sum, item) => sum + migrateAcademicValue(item, parentKey), 0);
  if (!value || typeof value !== 'object') return 0;
  const object = value as Record<string, unknown>;
  let changed = 0;
  if (parentKey === 'baseStats') {
    if ('atk' in object || 'def' in object) {
      object.hp = scaleStat(object.hp, 0.6, true);
      object.mp = scaleStat(object.mp, 0.6, true);
      object.spd = scaleStat(object.spd, 5 / 7, true);
      object.wis = scaleStat(object.wis, 0.6, true);
      changed += academic(object, true) ? 1 : 0;
    }
  } else if (parentKey === 'growth') {
    if ('base' in object) return 0;
    const base = { ...object };
    const oldAttack = base.atk;
    const oldDefense = base.def;
    if (academic(base, false)) {
      base.hp = scaleGrowth(base.hp, 0.6, 35);
      base.mp = scaleGrowth(base.mp, 0.6, 15);
      base.scienceAtk = scaleGrowth(oldAttack, 0.625, 15);
      base.humanitiesAtk = base.scienceAtk;
      base.scienceDef = scaleGrowth(oldDefense, 2 / 3, 15);
      base.humanitiesDef = base.scienceDef;
      base.spd = scaleGrowth(base.spd, 5 / 7, 15);
      base.wis = scaleGrowth(base.wis, 0.6, 5);
      for (const key of Object.keys(object)) delete object[key];
      object.base = base;
      object.every5 = {
        hp: 2,
        mp: 1,
        scienceAtk: 1,
        humanitiesAtk: 1,
        scienceDef: 1,
        humanitiesDef: 1,
        spd: 1,
        wis: 0,
      };
      object.every10 = {
        hp: 3,
        mp: 1,
        scienceAtk: 1,
        humanitiesAtk: 1,
        scienceDef: 1,
        humanitiesDef: 1,
        spd: 1,
        wis: 1,
      };
      changed += 1;
    }
  } else if (parentKey === 'stats') {
    changed += academic(object, true) ? 1 : 0;
  }
  for (const [key, child] of Object.entries(object)) changed += migrateAcademicValue(child, key);
  return changed;
}
