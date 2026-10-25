import type { FieldEventCommand } from '../../core/events/contracts';
import type { MapTransitionRequest } from './mapTransitionPipeline';

export type FieldDirection = 'down' | 'left' | 'right' | 'up';
export type FieldInteractionIntent = 'arrive' | 'interact' | 'menu';
export type FieldActivation = 'counter' | 'front' | 'menu' | 'nearby' | 'underfoot';

export interface FieldPosition {
  x: number;
  y: number;
}

interface CandidateBase {
  id: string;
  activation: FieldActivation;
  position?: FieldPosition;
  requiredFacing?: FieldDirection;
}

export type FieldInteractionCandidate =
  | (CandidateBase & { kind: 'menu'; activation: 'menu' })
  | (CandidateBase & {
      kind: 'battle';
      battleType: 'area-boss' | 'last-boss' | 'mid-boss' | 'random' | 'region-boss';
    })
  | (CandidateBase & { kind: 'npc' | 'chest' | 'sign' | 'background' | 'field-event' | 'warp' })
  | (CandidateBase & { kind: 'locked-transition'; activation: 'underfoot' })
  | (CandidateBase & {
      kind: 'map-transition';
      activation: 'underfoot';
      request: MapTransitionRequest;
    })
  | (CandidateBase & {
      kind: 'event-command';
      commands: readonly FieldEventCommand[];
      flags?: ReadonlySet<string>;
    });

export interface FieldInteractionInput {
  intent: FieldInteractionIntent;
  player: { position: FieldPosition; facing: FieldDirection };
  frontTile: { position: FieldPosition; isCounter: boolean };
  flow: { locked: boolean; frame: number; lastHandledFrame: number | null };
  candidates: readonly FieldInteractionCandidate[];
}

export type FieldInteractionDecision =
  | { kind: 'none'; reason: 'already-handled-frame' | 'flow-locked' | 'no-target' }
  | { kind: 'action'; candidate: FieldInteractionCandidate };

const PRIORITY: Record<FieldInteractionIntent, Partial<Record<FieldInteractionCandidate['kind'], number>>> = {
  menu: { menu: 10 },
  interact: {
    battle: 10,
    npc: 20,
    chest: 30,
    sign: 40,
    'field-event': 40,
    'event-command': 40,
    background: 50,
  },
  arrive: {
    'locked-transition': 10,
    'map-transition': 20,
    warp: 30,
    'field-event': 40,
    'event-command': 40,
    battle: 50,
  },
};

function samePosition(left: FieldPosition | undefined, right: FieldPosition): boolean {
  return left?.x === right.x && left.y === right.y;
}

function candidateMatches(candidate: FieldInteractionCandidate, input: FieldInteractionInput): boolean {
  if (candidate.requiredFacing && candidate.requiredFacing !== input.player.facing) return false;
  if (input.intent === 'menu') return candidate.activation === 'menu';
  if (candidate.activation === 'menu') return false;
  if (candidate.activation === 'front') return samePosition(candidate.position, input.frontTile.position);
  if (candidate.activation === 'underfoot') return samePosition(candidate.position, input.player.position);
  if (candidate.activation === 'nearby')
    return (
      !!candidate.position &&
      Math.max(
        Math.abs(candidate.position.x - input.player.position.x),
        Math.abs(candidate.position.y - input.player.position.y),
      ) <= 1
    );
  if (!input.frontTile.isCounter) return false;
  const beyondCounter = {
    x: input.frontTile.position.x + (input.frontTile.position.x - input.player.position.x),
    y: input.frontTile.position.y + (input.frontTile.position.y - input.player.position.y),
  };
  return samePosition(candidate.position, beyondCounter);
}

/** 正規化済み候補から、priority contractに従って一件だけを選ぶpure resolver。 */
export function resolveFieldInteraction(input: FieldInteractionInput): FieldInteractionDecision {
  if (input.flow.locked) return { kind: 'none', reason: 'flow-locked' };
  if (input.flow.lastHandledFrame === input.flow.frame)
    return { kind: 'none', reason: 'already-handled-frame' };

  let selected: FieldInteractionCandidate | undefined;
  let selectedPriority = Number.POSITIVE_INFINITY;
  for (const candidate of input.candidates) {
    const priority = PRIORITY[input.intent][candidate.kind];
    const offset = candidate.activation === 'counter' ? 1 : candidate.activation === 'nearby' ? 2 : 0;
    const candidatePriority = priority === undefined ? undefined : priority + offset;
    if (
      candidatePriority === undefined ||
      candidatePriority >= selectedPriority ||
      !candidateMatches(candidate, input)
    )
      continue;
    selected = candidate;
    selectedPriority = candidatePriority;
  }
  return selected ? { kind: 'action', candidate: selected } : { kind: 'none', reason: 'no-target' };
}
