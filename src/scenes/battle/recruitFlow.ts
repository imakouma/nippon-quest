import type { Monster } from '../../core/content/schemas';
import type { BattleState } from '../../core/battle/types';

export function recruitGiftId(state: BattleState, enemy: Monster): string | undefined {
  const gift = enemy.recruitItem;
  return gift && (state.ally.items[gift] ?? 0) > 0 ? gift : undefined;
}

export function canRecruitByCommand(input: {
  state: BattleState;
  enemy: Monster;
  storyCompanion: boolean;
  hpThreshold: number;
}): boolean {
  const { state, enemy } = input;
  return (
    input.storyCompanion &&
    state.ruleset.recruitment.mode === 'standard' &&
    enemy.recruitRate > 0 &&
    state.enemy.hp > 0 &&
    (Boolean(recruitGiftId(state, enemy)) || state.enemy.hp / state.enemy.stats.hp <= input.hpThreshold)
  );
}
