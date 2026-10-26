import type { Dir, TilePoint } from '../../shared/world';

export type { Dir, TilePoint } from '../../shared/world';

export const TURN_DURATION_MS = 80;
export const BUMP_DURATION_MS = 100;
export const STEP_DURATION_MS = 160;

export type LeadFoot = 'a' | 'b';

interface LocomotionBase {
  facing: Dir;
  leadFoot: LeadFoot;
}

export type LocomotionState =
  | ({ phase: 'idle' } & LocomotionBase)
  | ({ phase: 'turning'; elapsedMs: number } & LocomotionBase)
  | ({
      phase: 'stepping';
      from: TilePoint;
      to: TilePoint;
      progress: number;
    } & LocomotionBase)
  | ({ phase: 'bumping'; progress: number } & LocomotionBase)
  | ({ phase: 'scripted' | 'frozen' } & LocomotionBase);

export type LocomotionPlayerCommand =
  { type: 'step'; direction: Dir; from: TilePoint; to: TilePoint } | { type: 'bump'; direction: Dir };

export type LocomotionCommand =
  | LocomotionPlayerCommand
  | { type: 'advance'; deltaMs: number }
  | { type: 'freeze' }
  | { type: 'script'; facing?: Dir }
  | { type: 'resume' };

export type LocomotionEvent =
  | { type: 'turned'; direction: Dir }
  | { type: 'stepStarted'; direction: Dir; from: TilePoint; to: TilePoint; leadFoot: LeadFoot }
  | { type: 'footPlanted'; direction: Dir; at: TilePoint; leadFoot: LeadFoot }
  | { type: 'stepCompleted'; direction: Dir; from: TilePoint; to: TilePoint; leadFoot: LeadFoot }
  | { type: 'bumped'; direction: Dir };

export interface LocomotionResult {
  state: LocomotionState;
  events: LocomotionEvent[];
}

export function createLocomotionState(facing: Dir = 'down', leadFoot: LeadFoot = 'a'): LocomotionState {
  return { phase: 'idle', facing, leadFoot };
}

const unchanged = (state: LocomotionState): LocomotionResult => ({ state, events: [] });
const safeDelta = (deltaMs: number): number => (Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0);
const clampProgress = (progress: number): number => Math.max(0, Math.min(1, progress));
const otherFoot = (foot: LeadFoot): LeadFoot => (foot === 'a' ? 'b' : 'a');

function advance(state: LocomotionState, deltaMs: number): LocomotionResult {
  const delta = safeDelta(deltaMs);
  switch (state.phase) {
    case 'turning': {
      const elapsedMs = Math.min(TURN_DURATION_MS, state.elapsedMs + delta);
      if (elapsedMs < TURN_DURATION_MS) return { state: { ...state, elapsedMs }, events: [] };
      return {
        state: createLocomotionState(state.facing, state.leadFoot),
        events: [{ type: 'turned', direction: state.facing }],
      };
    }
    case 'stepping': {
      const progress = clampProgress(state.progress + delta / STEP_DURATION_MS);
      if (progress < 1) return { state: { ...state, progress }, events: [] };
      return {
        state: createLocomotionState(state.facing, otherFoot(state.leadFoot)),
        events: [
          {
            type: 'footPlanted',
            direction: state.facing,
            at: state.to,
            leadFoot: state.leadFoot,
          },
          {
            type: 'stepCompleted',
            direction: state.facing,
            from: state.from,
            to: state.to,
            leadFoot: state.leadFoot,
          },
        ],
      };
    }
    case 'bumping': {
      const progress = clampProgress(state.progress + delta / BUMP_DURATION_MS);
      if (progress < 1) return { state: { ...state, progress }, events: [] };
      return {
        state: createLocomotionState(state.facing, state.leadFoot),
        events: [{ type: 'bumped', direction: state.facing }],
      };
    }
    default:
      return unchanged(state);
  }
}

export function dispatchLocomotion(state: LocomotionState, command: LocomotionCommand): LocomotionResult {
  if (command.type === 'freeze') {
    return { state: { phase: 'frozen', facing: state.facing, leadFoot: state.leadFoot }, events: [] };
  }
  if (command.type === 'script') {
    return {
      state: {
        phase: 'scripted',
        facing: command.facing ?? state.facing,
        leadFoot: state.leadFoot,
      },
      events: [],
    };
  }
  if (command.type === 'resume') {
    return state.phase === 'frozen' || state.phase === 'scripted'
      ? { state: createLocomotionState(state.facing, state.leadFoot), events: [] }
      : unchanged(state);
  }
  if (command.type === 'advance') return advance(state, command.deltaMs);
  if (state.phase !== 'idle') return unchanged(state);
  if (command.direction !== state.facing) {
    return {
      state: {
        phase: 'turning',
        facing: command.direction,
        elapsedMs: 0,
        leadFoot: state.leadFoot,
      },
      events: [],
    };
  }
  if (command.type === 'bump') {
    return {
      state: { phase: 'bumping', facing: state.facing, progress: 0, leadFoot: state.leadFoot },
      events: [],
    };
  }
  const from = { ...command.from };
  const to = { ...command.to };
  return {
    state: {
      phase: 'stepping',
      facing: state.facing,
      from,
      to,
      progress: 0,
      leadFoot: state.leadFoot,
    },
    events: [
      {
        type: 'stepStarted',
        direction: state.facing,
        from,
        to,
        leadFoot: state.leadFoot,
      },
    ],
  };
}

export function advanceLocomotion(state: LocomotionState, deltaMs: number): LocomotionResult {
  return dispatchLocomotion(state, { type: 'advance', deltaMs });
}
