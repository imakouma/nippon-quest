import { encounterLevel } from '../../core/battle/setup';
import {
  decideContentEncounterStep,
  type EncounterSelection,
  type EncounterStepContext,
} from '../../core/encounter/contentAdapter';
import type { EncounterDecision, EncounterPolicyState } from '../../core/encounter/policy';
import type { Rng } from '../../core/rng';
import type { BattleSceneData } from '../battle/contracts';

export function battleFromEncounterDecision(
  decision: EncounterDecision<EncounterSelection>,
  heroLevel: number,
  rng: Rng,
): BattleSceneData | null {
  if (decision.kind === 'none') return null;
  const { enemyId, zone, ground } = decision.encounter;
  return { enemyId, level: encounterLevel(heroLevel, rng), zone, ...(ground ? { ground } : {}) };
}

export function resolveEncounterStep(input: {
  state: EncounterPolicyState;
  context: EncounterStepContext;
  rng: Rng;
  heroLevel: number;
  suppressed?: boolean;
}): { state: EncounterPolicyState; battle: BattleSceneData | null } {
  const result = decideContentEncounterStep(input.state, input.context, input.rng, input.suppressed);
  return {
    state: result.state,
    battle: battleFromEncounterDecision(result.decision, input.heroLevel, input.rng),
  };
}
