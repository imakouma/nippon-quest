import type { Rng } from '../rng';
import type { Command } from './types';

export type TurnActor = 'hero' | 'companion' | 'enemy';

export interface InitiativeEntry {
  actor: TurnActor;
  speed: number;
  priority: number;
}

/** 道具・交代・逃走は通常行動より先。以降は素早さ、同速はシード乱数で決める。 */
export function commandPriority(command: Command): number {
  return command.kind === 'item' || command.kind === 'swap' || command.kind === 'flee' ? 1 : 0;
}

export function initiativeOrder(entries: readonly InitiativeEntry[], rng: Rng): TurnActor[] {
  return entries
    .map((entry) => ({ ...entry, tie: rng.next() }))
    .sort((a, b) => b.priority - a.priority || b.speed - a.speed || b.tie - a.tie)
    .map(({ actor }) => actor);
}
