import type { ContentIndex } from '../content/loader';
import type { GameState } from '../state/schema';
import { TRIAL_CORE_ID } from './eventReward';
import { LEARNING_FRAGMENT_ID } from './learningRewards';
import { previewLevelCapUnlock } from './levelCap';
import { levelForXp } from './battleResult';
import { syncCappedLevels } from './battleSettlement';

export const GROWTH_MAGATAMA_ID = 'growth-magatama';

export type LevelCapTargetRef = { kind: 'hero' } | { kind: 'monster'; uid: string };
export type LevelCapUnlockFailure =
  'unknown-target' | 'not-at-cap' | 'insufficient-materials' | 'absolute-cap';

export type LevelCapUnlockResult =
  | {
      ok: true;
      state: GameState;
      oldCap: number;
      newCap: number;
      oldLevel: number;
      newLevel: number;
    }
  | { ok: false; state: GameState; reason: LevelCapUnlockFailure };

export function unlockLevelCap(
  prev: GameState,
  target: LevelCapTargetRef,
  content: ContentIndex,
  now = Date.now(),
): LevelCapUnlockResult {
  const owned =
    target.kind === 'monster' ? prev.party.owned.find((monster) => monster.uid === target.uid) : null;
  if (target.kind === 'monster' && !owned) return { ok: false, state: prev, reason: 'unknown-target' };

  const current = target.kind === 'hero' ? prev.player : owned!;
  const preview = previewLevelCapUnlock(
    { kind: target.kind, level: current.level, levelCap: current.levelCap },
    {
      learningFragments: prev.inventory[LEARNING_FRAGMENT_ID] ?? 0,
      trialCores: prev.inventory[TRIAL_CORE_ID] ?? 0,
    },
    content.settings.levelCaps,
  );
  if (!preview.ok) return { ok: false, state: prev, reason: preview.reason };

  const inventory = {
    ...prev.inventory,
    [LEARNING_FRAGMENT_ID]: (prev.inventory[LEARNING_FRAGMENT_ID] ?? 0) - preview.cost.learningFragments,
    [TRIAL_CORE_ID]: (prev.inventory[TRIAL_CORE_ID] ?? 0) - preview.cost.trialCores,
  };
  const oldCap = current.levelCap;
  const oldLevel = current.level;
  if (target.kind === 'hero') {
    const raised = {
      ...prev,
      updatedAt: now,
      inventory,
      player: { ...prev.player, levelCap: preview.nextCap },
    };
    const synced = syncCappedLevels(prev, raised, content).state;
    const state = { ...synced, party: raised.party };
    return {
      ok: true,
      state,
      oldCap,
      newCap: preview.nextCap,
      oldLevel,
      newLevel: state.player.level,
    };
  }

  const newLevel = Math.max(owned!.level, levelForXp(content.xp.monster, owned!.xp, preview.nextCap));
  const state: GameState = {
    ...prev,
    updatedAt: now,
    inventory,
    party: {
      ...prev.party,
      owned: prev.party.owned.map((monster) =>
        monster.uid === target.uid ? { ...monster, levelCap: preview.nextCap, level: newLevel } : monster,
      ),
    },
  };
  return { ok: true, state, oldCap, newCap: preview.nextCap, oldLevel, newLevel };
}
