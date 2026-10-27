import type { Monster } from '../../core/content/schemas';
import type { BattleState } from '../../core/battle/types';

export function recruitGiftId(state: BattleState, enemy: Monster): string | undefined {
  const gift = enemy.recruitItem;
  return gift && (state.ally.items[gift] ?? 0) > 0 ? gift : undefined;
}
