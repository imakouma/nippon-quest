/**
 * ダメージ計算。GDD §4.3 の「問題の出来 → わざの威力」がここに集約される。
 *   BaseDamage  = こうげき × いりょく ÷ ぼうぎょ × damageScale（必殺技は かしこさ で いりょく アップ）
 *   ComboBonus  = 1 + comboCount × perCombo（最大 +maxBonus）
 *   FinalDamage = BaseDamage × ScoreMultiplier × ComboBonus × ElementMultiplier（× かいしん）
 * 純粋関数のみ。Phaser・DOM・GameState を知らない。
 */
import type { Element, ElementTable, Settings, Skill, Stats } from '../content/schemas';
import type { Rng } from '../rng';
import type { Combatant, ScoreBandName } from './types';

export type ScoreBand = ScoreBandName;
export type AttackClass = 'science' | 'humanities' | 'balanced';

export function selectAcademicStats(
  attacker: Stats,
  defender: Stats,
  attackClass: AttackClass,
): { attack: number; defense: number } {
  const legacyAttacker = attacker as Stats & { atk?: number };
  const legacyDefender = defender as Stats & { def?: number };
  const scienceAtk = attacker.scienceAtk ?? legacyAttacker.atk ?? 0;
  const humanitiesAtk = attacker.humanitiesAtk ?? legacyAttacker.atk ?? 0;
  const scienceDef = defender.scienceDef ?? legacyDefender.def ?? 0;
  const humanitiesDef = defender.humanitiesDef ?? legacyDefender.def ?? 0;
  if (attackClass === 'science') return { attack: scienceAtk, defense: scienceDef };
  if (attackClass === 'humanities') return { attack: humanitiesAtk, defense: humanitiesDef };
  return {
    attack: Math.floor((scienceAtk + humanitiesAtk) / 2),
    defense: Math.floor((scienceDef + humanitiesDef) / 2),
  };
}

export function pokemonLikeBaseDamage(level: number, power: number, attack: number, defense: number): number {
  const levelFactor = Math.floor((2 * level) / 5) + 2;
  const scaled = Math.floor((levelFactor * power * attack) / Math.max(1, defense));
  return Math.floor(scaled / 50) + 2;
}

export function attackClassFor(skill: Skill | null): AttackClass {
  if (!skill) return 'balanced';
  if (skill.attackClass) return skill.attackClass;
  if (skill.subject === 'sansu' || skill.subject === 'rika') return 'science';
  if (skill.subject === 'seikatsu') return 'balanced';
  return 'humanities';
}

/** 1.0 = CRITICAL / 0.5〜0.99 = GREAT / 0.01〜0.49 = GOOD / 0 = MISS */
export function scoreBand(score: number): ScoreBand {
  if (score >= 1) return 'perfect';
  if (score >= 0.5) return 'good';
  if (score > 0) return 'weak';
  return 'miss';
}

/**
 * score → 威力倍率。**miss でも 0 にしない**（GDD §1 判断基準2：不正解でもゲームは止まらない）。
 */
export function scoreMultiplier(score: number, s: Pick<Settings, 'scoreMultipliers'>): number {
  return s.scoreMultipliers[scoreBand(score)];
}

export function elementMultiplier(attack: Element, defend: Element, table: ElementTable): number {
  return table.multipliers[attack]?.[defend] ?? 1;
}

/** ComboBonus：いりょく（と けいけんち・おかね）の 上乗せ */
export function comboBonus(combo: number, s: Pick<Settings, 'combo'>): number {
  return 1 + Math.min(s.combo.maxBonus, Math.max(0, combo) * s.combo.perCombo);
}

/** かいしんの いちげき の 確率。コンボで 上がる */
export function critChance(combo: number, s: Pick<Settings, 'combo'>): number {
  return Math.min(s.combo.critMax, s.combo.critBase + Math.max(0, combo) * s.combo.critPerCombo);
}

export interface DamageInput {
  attacker: Combatant;
  defender: Combatant;
  /** 通常攻撃なら null */
  skill: Skill | null;
  /** 問題のスコア。問題の ない こうげき（たたかう・オトモ・敵）は null（倍率 1） */
  score: number | null;
  /** いまの コンボ数（味方の こうげきだけ。敵は 0） */
  combo: number;
  /** かいしんが 出るか（味方の こうげきだけ） */
  canCrit: boolean;
  settings: Settings;
  elements: ElementTable;
  rng: Rng;
}

export interface DamageOutput {
  amount: number;
  /** かいしんの いちげき */
  critical: boolean;
  /** 属性表の 倍率（「よく きいている」の 判定用） */
  elementMult: number;
  weaknessHit: boolean;
  band: ScoreBand | null;
  scoreMult: number;
  comboMult: number;
}

export function computeDamage(input: DamageInput): DamageOutput {
  const { attacker, defender, skill, score, settings, elements, rng } = input;
  const pair = selectAcademicStats(attacker.stats, defender.stats, attackClassFor(skill));
  const wisdomAttack = skill ? Math.floor(attacker.stats.wis / 5) : 0;
  const atk = Math.max(1, Math.floor((pair.attack + wisdomAttack) * (attacker.buffs.atk?.mult ?? 1)));
  const def = Math.max(1, Math.floor(pair.defense * (defender.buffs.def?.mult ?? 1)));
  const base = pokemonLikeBaseDamage(attacker.level, skill?.power ?? 100, atk, def);

  const element: Element = skill ? skill.element : attacker.element;
  const band = score === null ? null : scoreBand(score);
  const scoreMult = score === null ? 1 : scoreMultiplier(score, settings);
  const comboMult = comboBonus(input.combo, settings);

  const elementMult = elementMultiplier(element, defender.element, elements);
  const weaknessHit =
    defender.weaknessRevealed && defender.weakness !== undefined && defender.weakness === element;
  const weakMult = weaknessHit ? settings.weaknessMultiplier : 1;
  const setBoost = attacker.elementBoost?.[element] ?? 1;
  const resistance = defender.elementResists?.includes(element) ? settings.equipmentElementResistance : 1;

  const critical = input.canCrit && rng.chance(critChance(input.combo, settings));
  const critMult = critical ? settings.combo.critMultiplier : 1;
  const randomMult = rng.int(85, 100) / 100;

  const amount = Math.max(
    1,
    Math.floor(
      base * scoreMult * comboMult * elementMult * weakMult * setBoost * resistance * critMult * randomMult,
    ),
  );
  return { amount, critical, elementMult, weaknessHit, band, scoreMult, comboMult };
}

/** 逃走成功率：すばやさ比。ボス戦は呼び出し側で禁止する */
export function fleeChance(self: Combatant, enemy: Combatant): number {
  return Math.min(0.95, Math.max(0.15, (self.stats.spd / Math.max(1, enemy.stats.spd)) * 0.5));
}

/**
 * 仲間化成功率（GDD §4.6）
 *  - HP が閾値以下でないと 0
 *  - 問題 score 1.0 なら成功率 ×2
 *  - 専用アイテムを使ったときは呼び出し側が 1.0 を渡す
 */
export function recruitChance(
  target: Combatant,
  baseRate: number,
  hpRatio: number,
  score: number,
  settings: Pick<Settings, 'recruitHpThreshold'>,
): number {
  if (target.isBoss) return 0;
  if (hpRatio > settings.recruitHpThreshold) return 0;
  const scoreBonus = score >= 1 ? 2 : 1;
  return Math.min(0.95, baseRate * scoreBonus * (1 + (1 - hpRatio)));
}
