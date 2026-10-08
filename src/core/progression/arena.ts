/** 闘技場とマップ訪問の進行。UI や Phaser に依存しない純粋関数だけを置く。 */
import type { GameState } from '../state/schema';

/** 闘技場の勝利報酬とバッジを反映する。 */
export function applyArenaVictory(prev: GameState, prize: number, now = Date.now()): GameState {
  const next = structuredClone(prev);
  next.player.gold += prize;
  next.arena.badges += 1;
  next.updatedAt = now;
  return next;
}

/** マップの初回訪問を記録する。記録済みなら同じ状態を返す。 */
export function markMapVisited(prev: GameState, mapKey: string, now = Date.now()): GameState {
  const key = `visit:${mapKey}`;
  if (prev.progress.counters[key]) return prev;
  const next = structuredClone(prev);
  next.progress.counters[key] = 1;
  next.updatedAt = now;
  return next;
}
