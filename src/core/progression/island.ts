/**
 * 島（地方）の進行。UI や Phaser に依存しない純粋関数だけを置く。
 */
import type { World } from '../content/schemas';
import type { GameState } from '../state/schema';

/** 島に属する全県の「県のしるし」が揃っているか。重複したしるしは1県分として扱う。 */
export function hasAllAreaSigns(world: World, islandId: string, areaSigns: readonly string[]): boolean {
  const island = world.islands.find((candidate) => candidate.id === islandId);
  if (!island) return false;
  const signs = new Set(areaSigns);
  return island.areas.every((areaId) => signs.has(areaId));
}

/** 県のしるしが揃い、まだクリアしていない島だけ地方ボスへ挑戦できる。 */
export function canChallengeIslandBoss(
  world: World,
  islandId: string,
  progress: Pick<GameState['progress'], 'areaSigns' | 'islandsCleared'>,
): boolean {
  const island = world.islands.find((candidate) => candidate.id === islandId);
  return (
    island?.status === 'playable' &&
    !progress.islandsCleared.includes(islandId) &&
    hasAllAreaSigns(world, islandId, progress.areaSigns)
  );
}

/**
 * 地方ボス勝利後の更新。しるし不足なら変更せず、同じ島は一度だけ記録する。
 * 戦闘結果の判定は呼び出し側が担当し、勝利時だけこの関数を呼ぶ。
 */
export function completeIsland(prev: GameState, world: World, islandId: string, now = Date.now()): GameState {
  if (!canChallengeIslandBoss(world, islandId, prev.progress)) return prev;
  return {
    ...prev,
    updatedAt: now,
    progress: {
      ...prev.progress,
      islandsCleared: [...prev.progress.islandsCleared, islandId],
    },
  };
}
