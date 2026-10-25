import type { Rng } from '../rng';

export interface EncounterCandidate<T> {
  encounter: T;
  weight: number;
}

export interface EncounterPolicyInput<T> {
  eligible: boolean;
  stepsPerCheck: number;
  rate: number;
  candidates: readonly EncounterCandidate<T>[];
}

export interface EncounterPacing {
  transitionInhibitSteps: number;
  cooldownSteps: number;
  maxMissedChecks: number;
}

export const DEFAULT_ENCOUNTER_PACING: EncounterPacing = {
  transitionInhibitSteps: 3,
  cooldownSteps: 4,
  maxMissedChecks: 3,
};

export interface EncounterPolicyState {
  traversedSteps: number;
  eligibleStepsSinceCheck: number;
  missedChecks: number;
  cooldownStepsRemaining: number;
}

export type EncounterDecision<T> =
  | {
      kind: 'none';
      reason: 'ineligible' | 'transition-inhibit' | 'cooldown' | 'interval' | 'chance';
    }
  | { kind: 'encounter'; encounter: T; forcedByPity: boolean };

export interface EncounterPolicyResult<T> {
  state: EncounterPolicyState;
  decision: EncounterDecision<T>;
}

export function createEncounterPolicyState(): EncounterPolicyState {
  return {
    traversedSteps: 0,
    eligibleStepsSinceCheck: 0,
    missedChecks: 0,
    cooldownStepsRemaining: 0,
  };
}

export function beginEncounterCooldown(
  state: EncounterPolicyState,
  pacing: EncounterPacing = DEFAULT_ENCOUNTER_PACING,
): EncounterPolicyState {
  return {
    ...state,
    eligibleStepsSinceCheck: 0,
    missedChecks: 0,
    cooldownStepsRemaining: pacing.cooldownSteps,
  };
}

export function decideEncounterStep<T>(
  state: EncounterPolicyState,
  input: EncounterPolicyInput<T>,
  rng: Rng,
  pacing: EncounterPacing = DEFAULT_ENCOUNTER_PACING,
): EncounterPolicyResult<T> {
  const next = { ...state, traversedSteps: state.traversedSteps + 1 };
  if (!input.eligible || input.candidates.length === 0)
    return { state: next, decision: { kind: 'none', reason: 'ineligible' } };
  if (next.traversedSteps <= pacing.transitionInhibitSteps)
    return { state: next, decision: { kind: 'none', reason: 'transition-inhibit' } };
  if (next.cooldownStepsRemaining > 0)
    return {
      state: { ...next, cooldownStepsRemaining: next.cooldownStepsRemaining - 1 },
      decision: { kind: 'none', reason: 'cooldown' },
    };

  next.eligibleStepsSinceCheck++;
  if (next.eligibleStepsSinceCheck < input.stepsPerCheck)
    return { state: next, decision: { kind: 'none', reason: 'interval' } };

  next.eligibleStepsSinceCheck = 0;
  const forcedByPity = input.rate > 0 && next.missedChecks >= pacing.maxMissedChecks;
  if (!forcedByPity && !rng.chance(input.rate))
    return {
      state: { ...next, missedChecks: Math.min(next.missedChecks + 1, pacing.maxMissedChecks) },
      decision: { kind: 'none', reason: 'chance' },
    };

  const encounter = rng.weighted(
    input.candidates.map((candidate) => ({ item: candidate.encounter, weight: candidate.weight })),
  );
  return {
    state: beginEncounterCooldown(next, pacing),
    decision: { kind: 'encounter', encounter, forcedByPity },
  };
}
