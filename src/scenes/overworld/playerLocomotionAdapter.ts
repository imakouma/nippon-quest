import type { LocomotionPlayerCommand } from '../../core/world/playerLocomotion';
import type { Dir } from '../../shared/world';
import type { MovementDecision } from './movementDecision';

export function locomotionCommandFromDecision<TBoss, TGate, TInterPrefecture>(
  direction: Dir,
  from: readonly [number, number],
  decision: MovementDecision<TBoss, TGate, TInterPrefecture>,
): LocomotionPlayerCommand | null {
  switch (decision.kind) {
    case 'move':
      return {
        type: 'step',
        direction,
        from: { x: from[0], y: from[1] },
        to: { x: decision.x, y: decision.y },
      };
    case 'blocked':
    case 'stand':
      return { type: 'bump', direction };
    default:
      return null;
  }
}
