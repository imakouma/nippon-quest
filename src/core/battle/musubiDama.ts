const SPEED_BONUS_MAX = 0.4;
const SPEED_BONUS_WINDOW_MS = 15_000;
const MAX_CHANCE = 0.9;

export interface MusubiDamaAttempt {
  baseRate: number;
  hpRatio: number;
  score: number;
  timeMs: number;
  timeLimitScale: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function canUseMusubiDama(input: { isBoss: boolean; hp: number; recruitRate: number }): boolean {
  return !input.isBoss && input.hp > 0 && input.recruitRate > 0;
}

/** 弱らせ方・正解度・速さのすべてが報われる、むすび玉専用の成功率。 */
export function musubiDamaChance(input: MusubiDamaAttempt): number {
  const score = clamp01(input.score);
  if (input.baseRate <= 0) return 0;
  const hpChance = clamp01(input.baseRate) + (1 - clamp01(input.hpRatio)) * 0.65;
  const timeScale = Number.isFinite(input.timeLimitScale) ? Math.max(0.1, input.timeLimitScale) : 1;
  const elapsed = Math.max(0, Number.isFinite(input.timeMs) ? input.timeMs : SPEED_BONUS_WINDOW_MS);
  const speedRatio = 1 - Math.min(1, elapsed / (SPEED_BONUS_WINDOW_MS * timeScale));
  return Math.min(MAX_CHANCE, hpChance * score * (1 + SPEED_BONUS_MAX * speedRatio));
}
import type { Item, Monster } from '../content/schemas';
import type { Rng } from '../rng';
import type { BattleEvent, BattleState, Command } from './types';

export function useMusubiDama(
  state: BattleState,
  item: Item,
  monster: Monster | undefined,
  command: Extract<Command, { kind: 'item' }>,
  rng: Rng,
  events: BattleEvent[],
): boolean {
  const count = state.ally.items[item.id] ?? 0;
  if (
    count <= 0 ||
    !item.use?.recruit ||
    !command.result ||
    !monster ||
    !canUseMusubiDama({
      isBoss: state.isBossBattle || Boolean(state.enemy.isBoss),
      hp: state.enemy.hp,
      recruitRate: monster.recruitRate,
    })
  )
    return false;
  state.ally.items[item.id] = count - 1;
  events.push({ t: 'itemUsed', itemId: item.id, targetId: state.enemy.id, side: 'enemy' });
  const chance = musubiDamaChance({
    baseRate: monster.recruitRate,
    hpRatio: state.enemy.hp / Math.max(1, state.enemy.stats.hp),
    score: command.result.score,
    timeMs: command.result.timeMs,
    timeLimitScale: command.timeLimitScale ?? 1,
  });
  const success = chance > 0 && rng.chance(chance);
  events.push({ t: 'recruitAttempt', targetId: state.enemy.id, success, chance });
  if (success) {
    state.outcome = 'recruited';
    events.push({ t: 'recruited', monsterId: state.enemy.refId });
  }
  return true;
}
