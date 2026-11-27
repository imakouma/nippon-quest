import type { BattleState } from './types';

export function aimedBossAttack(state: BattleState, turn = state.turn): boolean {
  if (!state.isBossBattle || state.ally.hero.hp <= 0 || state.enemy.skipTurns > 0) return false;
  switch (state.enemy.refId) {
    case 'aomori-midboss-nebuta-taisho':
      return turn % 3 === 0;
    case 'aomori-boss-tsugaru-no-nushi':
      return turn % 4 === 0;
    case 'aomori-lastboss-tsugaru-tamenobu':
      return turn >= 5 && (turn - 5) % 3 === 0;
    default:
      return false;
  }
}
