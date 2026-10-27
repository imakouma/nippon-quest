import type { Skill } from '../content/schemas';
import type { Rng } from '../rng';

export type EnemyIntent =
  | { kind: 'attack' }
  | { kind: 'skill'; skillId: string }
  | { kind: 'heal'; skillId: string }
  | { kind: 'defend' };

export interface EnemyTacticsPolicy {
  id: string;
  lowHp: { threshold: number; action: 'prefer-heal' | 'weighted' };
  weights: { attack: number; skill: number; defend: number };
}

export interface EnemyDecisionContext {
  hp: number;
  maxHp: number;
  mp: number;
  skills: readonly Pick<Skill, 'id' | 'effect' | 'mp'>[];
}

export const STANDARD_ENEMY_TACTICS: EnemyTacticsPolicy = {
  id: 'standard',
  lowHp: { threshold: 0.3, action: 'prefer-heal' },
  weights: { attack: 0.6, skill: 0.3, defend: 0.1 },
};

export const AGGRESSIVE_ENEMY_TACTICS: EnemyTacticsPolicy = {
  id: 'aggressive',
  lowHp: { threshold: 0.3, action: 'weighted' },
  weights: { attack: 0.3, skill: 0.7, defend: 0 },
};

/** 敵の状態を変更せず、実行可能な次の行動だけを選ぶ。 */
export function selectEnemyIntent(
  context: EnemyDecisionContext,
  policy: EnemyTacticsPolicy,
  rng: Rng,
): EnemyIntent {
  // 標準戦術のリプレイ互換のため、低HP回復を選ぶ場合も先に1回消費する。
  const roll = rng.next();
  const usable = context.skills.filter((skill) => context.mp >= skill.mp);
  const heal = usable.find((skill) => skill.effect === 'heal');
  const hpRatio = context.hp / Math.max(1, context.maxHp);
  if (policy.lowHp.action === 'prefer-heal' && hpRatio <= policy.lowHp.threshold && heal) {
    return { kind: 'heal', skillId: heal.id };
  }

  const damage = usable.filter((skill) => skill.effect === 'damage');
  if (roll < policy.weights.skill && damage.length > 0) {
    return { kind: 'skill', skillId: rng.pick(damage).id };
  }
  if (roll < policy.weights.skill + policy.weights.attack || damage.length === 0) {
    return { kind: 'attack' };
  }
  return roll < policy.weights.skill + policy.weights.attack + policy.weights.defend
    ? { kind: 'defend' }
    : { kind: 'attack' };
}
