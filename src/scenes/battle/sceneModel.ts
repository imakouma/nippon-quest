import type { BattleSkill } from '../../core/battle/engine';
import type { BattleEvent, BattleState } from '../../core/battle/types';
import type { UiAction } from '../../ui/battle/store';

export type { BattleSkill };

export type Intent =
  | { kind: 'attack' }
  | { kind: 'flee' }
  | { kind: 'recruit' }
  | { kind: 'skill'; entry: BattleSkill }
  | { kind: 'item'; itemId: string }
  | { kind: 'swap'; index: number };

export type Phase = 'intro' | 'command' | 'question' | 'over';

export type MenuAction = Extract<UiAction, { t: 'command' | 'skill' | 'item' | 'swap' | 'back' }>;

export const BAND_TEXT = {
  perfect: 'battle.bandPerfect',
  good: 'battle.bandGood',
  weak: 'battle.bandWeak',
  miss: 'battle.bandMiss',
} as const;

/** セリフを先に出してから動く（「ハルの こうげき！」→ 走って斬る）イベント。 */
export const TALK_FIRST = new Set<BattleEvent['t']>([
  'act',
  'swap',
  'recruitGift',
  'itemUsed',
  'recruitAttempt',
]);

export function combatantName(state: BattleState, id: string): string {
  if (id === state.ally.hero.id) return state.ally.hero.name;
  if (id === state.enemy.id) return state.enemy.name;
  return state.ally.monsters.find((monster) => monster.id === id)?.name ?? id;
}

export function battleSkillStillUsable(
  state: BattleState,
  skills: readonly BattleSkill[],
  entry: BattleSkill,
): boolean {
  return skills.some((skill) => skill.actorId === entry.actorId && skill.skill.id === entry.skill.id);
}
