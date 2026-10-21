import type { Area, World } from '../../core/content/schemas';
import { normalizeUnavailableDeveloperTravel } from '../../core/progression/developerTravel';
import type { GameState } from '../../core/state/schema';

export interface DeveloperSceneRecovery {
  game: GameState;
  scene: {
    mapKey: string;
    spawnName: 'spawn';
    spawnTile: [number, number];
    exactSpawn: true;
    pendingInterPrefectureArrival: false;
  };
}

/** 公開環境に残ったdevセーブを、Sceneがそのまま適用できる復旧値へ変える。 */
export function unavailableDeveloperSceneRecovery(
  game: GameState | null | undefined,
  world: World | null | undefined,
  available: boolean,
  tileSize: number,
  now = Date.now(),
  areas?: ReadonlyMap<string, Pick<Area, 'regions'>>,
): DeveloperSceneRecovery | null {
  if (!game || !world) return null;
  const normalized = normalizeUnavailableDeveloperTravel(game, world, available, now, areas);
  if (normalized === game) return null;
  return {
    game: normalized,
    scene: {
      mapKey: normalized.progress.currentMap,
      spawnName: 'spawn',
      spawnTile: [
        Math.floor(normalized.progress.position.x / tileSize),
        Math.floor(normalized.progress.position.y / tileSize),
      ],
      exactSpawn: true,
      pendingInterPrefectureArrival: false,
    },
  };
}
