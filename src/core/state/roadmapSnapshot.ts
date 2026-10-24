import type { GameState } from './schema';

export const ROADMAP_MASTERY_SNAPSHOT_COUNTER = 'learning.roadmap-mastery-snapshot.v1';
export const ROADMAP_GRANDFATHERED_PREFIX = 'learning.roadmap-grandfathered:';

/**
 * スキルツリー導入前に単元習熟条件を満たしていた進捗を一度だけ保存する。
 * 以後の新しい回答は概念別の完全性で判定し、旧進捗だけは再ロックしない。
 */
export function ensureRoadmapMasterySnapshot(state: GameState): GameState {
  if (state.progress.counters[ROADMAP_MASTERY_SNAPSHOT_COUNTER] === 1) return state;
  const counters: Record<string, number> = {
    ...state.progress.counters,
    [ROADMAP_MASTERY_SNAPSHOT_COUNTER]: 1,
  };
  for (const [unitId, record] of Object.entries(state.learning.mastery)) {
    if (record.value >= 0.8 && record.n >= 3) counters[`${ROADMAP_GRANDFATHERED_PREFIX}${unitId}`] = 1;
  }
  return { ...state, progress: { ...state.progress, counters } };
}

export function roadmapGrandfatheredUnitIds(state: GameState): string[] {
  return Object.entries(state.progress.counters)
    .filter(([key, value]) => key.startsWith(ROADMAP_GRANDFATHERED_PREFIX) && value > 0)
    .map(([key]) => key.slice(ROADMAP_GRANDFATHERED_PREFIX.length));
}
