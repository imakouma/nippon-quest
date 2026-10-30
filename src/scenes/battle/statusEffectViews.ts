import type { Combatant } from '../../core/battle/types';
import type { StatusEffectView } from '../../ui/battle/store';

function buffEffect(
  kind: StatusEffectView['kind'],
  buff: Combatant['buffs']['atk'],
): StatusEffectView | null {
  if (!buff || buff.turns <= 0 || buff.mult === 1) return null;
  return { kind, direction: buff.mult > 1 ? 'up' : 'down', turns: buff.turns };
}

export function buildStatusEffects(combatant: Combatant, stoppedTurns = 0): StatusEffectView[] {
  const effects = [
    buffEffect('attack', combatant.buffs.atk),
    buffEffect('defense', combatant.buffs.def),
  ].filter((effect): effect is StatusEffectView => effect !== null);
  if (stoppedTurns > 0) effects.push({ kind: 'stopped', direction: 'neutral', turns: stoppedTurns });
  return effects;
}
