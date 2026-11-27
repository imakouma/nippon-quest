import type { Monster, Settings } from '../content/schemas';
import type { Rng } from '../rng';
import { addProgressValue } from '../../shared/safeInteger';
import { comboBonus } from './damage';
import type { BattleActionRef, BattleEvent, BattleState } from './types';

/** ruleset を適用し、勝利時の報酬イベントを従来の乱数順で組み立てる。 */
export function victoryEvent(
  state: Pick<BattleState, 'ruleset' | 'player' | 'enemy' | 'isBossBattle'>,
  monster: Monster | undefined,
  settings: Settings,
  rng: Rng,
  action: BattleActionRef,
  heroXp?: readonly number[],
): Extract<BattleEvent, { t: 'victory' }> {
  const rewards = state.ruleset.rewards.mode === 'standard';
  const drops = rewards
    ? (monster?.drops ?? []).filter((drop) => rng.chance(drop.rate)).map((drop) => drop.itemId)
    : [];
  const recruitOffer =
    rewards && state.ruleset.recruitment.mode === 'standard' && rng.chance(monster?.recruitRate ?? 0);
  const bonus = comboBonus(state.player.maxCombo, settings);
  const baseXp = monster?.xp ?? 0;
  const level = state.enemy.level;
  const from = heroXp?.[level - 1];
  const to = heroXp?.[level];
  // 同レベルの通常戦なら約8勝。敵ごとの基本報酬差は緩やかに残す。
  const speciesWeight = Math.max(0.75, Math.min(1.35, baseXp / 27));
  const wins = state.isBossBattle ? 3 : 8;
  const scaledXp =
    baseXp > 0 && from !== undefined && to !== undefined
      ? Math.max(baseXp, ((to - from) / wins) * speciesWeight)
      : baseXp;
  return {
    t: 'victory',
    ...action,
    xp: rewards ? addProgressValue(0, Math.round(scaledXp * bonus)) : 0,
    gold: rewards ? addProgressValue(0, Math.round((monster?.gold ?? 0) * bonus)) : 0,
    drops,
    recruitOffer,
    bonus,
    maxCombo: state.player.maxCombo,
  };
}
