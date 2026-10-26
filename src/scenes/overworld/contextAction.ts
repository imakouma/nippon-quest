export type ContextActionKind = 'talk' | 'inspect' | 'open';

export interface ResolvedContextAction {
  kind: ContextActionKind;
  onActivate: () => void;
}

export interface ContextActionState {
  moving: boolean;
  turning: boolean;
  bumping: boolean;
  busy: boolean;
  inBattle: boolean;
  overlayOwnsInput: boolean;
}

export interface ContextActionTile {
  npc?: () => void;
  chest?: { opened: boolean; onActivate: () => void };
  inspect?: () => void;
}

export interface ContextActionInput {
  state: ContextActionState;
  bosses?: {
    midBoss?: () => void;
    regionBoss?: () => void;
    areaBoss?: () => void;
    lastBoss?: () => void;
  };
  front: ContextActionTile;
  current: ContextActionTile;
  /** Existing nested-loop order for the eight surrounding tiles. */
  surrounding: readonly ContextActionTile[];
}

/** Resolve the single interaction shared by keyboard and touch input. */
export function resolveContextAction(input: ContextActionInput): ResolvedContextAction | null {
  if (Object.values(input.state).some(Boolean)) return null;

  const boss = [
    input.bosses?.midBoss,
    input.bosses?.regionBoss,
    input.bosses?.areaBoss,
    input.bosses?.lastBoss,
  ].find((onActivate): onActivate is () => void => onActivate !== undefined);
  if (boss) return { kind: 'talk', onActivate: boss };

  for (const target of [input.front, input.current, ...input.surrounding]) {
    if (target.npc) return { kind: 'talk', onActivate: target.npc };
    if (target.chest && !target.chest.opened) return { kind: 'open', onActivate: target.chest.onActivate };
    if (target.inspect) return { kind: 'inspect', onActivate: target.inspect };
  }
  return null;
}
