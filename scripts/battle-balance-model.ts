export const BALANCE_LEVELS = [1, 5, 10, 20, 35, 50] as const;

export interface LegacyStats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spd: number;
  wis: number;
}

export function legacyStatsAtLevel(base: LegacyStats, growth: LegacyStats, level: number): LegacyStats {
  const elapsed = Math.max(0, level - 1);
  return {
    hp: Math.floor(base.hp + growth.hp * elapsed),
    mp: Math.floor(base.mp + growth.mp * elapsed),
    atk: Math.floor(base.atk + growth.atk * elapsed),
    def: Math.floor(base.def + growth.def * elapsed),
    spd: Math.floor(base.spd + growth.spd * elapsed),
    wis: Math.floor(base.wis + growth.wis * elapsed),
  };
}

export function legacyDamage(input: {
  attack: number;
  defense: number;
  wisdom: number;
  power: number;
  scoreMultiplier: number;
  scale: number;
}): number {
  const wisdomMultiplier = input.power === 100 ? 1 : 1 + input.wisdom * 0.01;
  const base =
    (input.attack * (input.power / 100) * wisdomMultiplier * input.scale) / Math.max(1, input.defense);
  return Math.max(1, Math.round(base * input.scoreMultiplier));
}

export function median(values: readonly number[]): number {
  if (!values.length) throw new Error('median requires at least one value');
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function relativeDrift(before: number, after: number): number {
  if (before === 0) return after === 0 ? 0 : Number.POSITIVE_INFINITY;
  return (after - before) / before;
}

/** 大きいほど敵側が有利。絶対ターン数ではなく敵味方の相対的な強さを表す。 */
export function combatPressure(turnsToWin: number, turnsToLose: number): number {
  return turnsToWin / Math.max(1, turnsToLose);
}
