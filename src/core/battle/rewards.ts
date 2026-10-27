import type { Monster, Settings } from '../content/schemas';
import type { Rng } from '../rng';
import { addProgressValue } from '../../shared/safeInteger';
import { comboBonus } from './damage';
import type { BattleActionRef, BattleEvent, BattleState } from './types';

/** ruleset を適用し、勝利時の報酬イベントを従来の乱数順で組み立てる。 */
export function victoryEvent(
  state: Pick<BattleState, 'ruleset' | 'enemy' | 'player'>,
  monster: Monster | undefined,
  settings: Settings,
  rng: Rng,
  action: BattleActionRef,
): Extract<BattleEvent, { t: 'victory' }> {
  const rewards = state.ruleset.rewards.mode === 'standard';
  const drops = rewards
    ? (monster?.drops ?? []).filter((drop) => rng.chance(drop.rate)).map((drop) => drop.itemId)
    : [];
  const recruitOffer =
    rewards &&
    state.ruleset.recruitment.mode === 'standard' &&
    !state.enemy.isBoss &&
    rng.chance(monster?.recruitRate ?? 0);
  const bonus = comboBonus(state.player.maxCombo, settings);
  return {
    t: 'victory',
    ...action,
    xp: rewards ? addProgressValue(0, Math.round((monster?.xp ?? 0) * bonus)) : 0,
    gold: rewards ? addProgressValue(0, Math.round((monster?.gold ?? 0) * bonus)) : 0,
    drops,
    recruitOffer,
    bonus,
    maxCombo: state.player.maxCombo,
  };
}
