import { walkFrame, type Dir } from './characters';

export type PlayerLeadFoot = 'a' | 'b';
export type PlayerMotionState =
  | { phase: 'idle'; facing: Dir; leadFoot: PlayerLeadFoot }
  | { phase: 'turning'; facing: Dir; elapsedMs: number }
  | {
      phase: 'stepping';
      facing: Dir;
      progress: number;
      leadFoot: PlayerLeadFoot;
    }
  | { phase: 'bumping'; facing: Dir; progress: number }
  | { phase: 'scripted' | 'frozen'; facing: Dir };

export interface PlayerMotionPose {
  frame: number;
  offsetX: number;
  offsetY: number;
  shadowScale: number;
}

const directionOffset = (facing: Dir): readonly [number, number] => {
  switch (facing) {
    case 'left':
      return [-1, 0];
    case 'right':
      return [1, 0];
    case 'up':
      return [0, -1];
    case 'down':
      return [0, 1];
  }
};

const plantedPose = (facing: Dir): PlayerMotionPose => ({
  frame: walkFrame(facing, 1),
  offsetX: 0,
  offsetY: 0,
  shadowScale: 1,
});

export function playerMotionPose(state: PlayerMotionState): PlayerMotionPose {
  if (state.phase === 'idle' || state.phase === 'scripted' || state.phase === 'frozen') {
    return plantedPose(state.facing);
  }

  if (state.phase === 'stepping') {
    if (state.progress <= 0 || state.progress >= 1) return plantedPose(state.facing);
    const cycle = state.progress + (state.leadFoot === 'b' ? 1 : 0);
    const column = cycle < 0.625 ? 0 : cycle < 1.25 ? 1 : cycle < 1.875 ? 2 : 1;
    return {
      frame: walkFrame(state.facing, column),
      offsetX: 0,
      offsetY: 0,
      shadowScale: 1,
    };
  }

  if (state.phase === 'turning') {
    return {
      frame: walkFrame(state.facing, 0),
      offsetX: 0,
      offsetY: 0,
      shadowScale: 0.9375,
    };
  }

  if (state.phase === 'bumping' && (state.progress <= 0 || state.progress >= 1)) {
    return plantedPose(state.facing);
  }

  const [offsetX, offsetY] = directionOffset(state.facing);
  return {
    frame: walkFrame(state.facing, 1),
    offsetX,
    offsetY,
    shadowScale: 0.875,
  };
}
