/** 県境・実在交通の到着地を、進行を壊さず一度に保存する。 */
import type { World } from '../content/schemas';
import type { GameState } from '../state/schema';
import { DEV_ALL_KEY } from './developerTravel';
import { interPrefectureArrivalKey } from './interPrefecture';

export { interPrefectureArrivalKey } from './interPrefecture';

const TILE_SIZE = 16;

export interface InterPrefectureArrival {
  targetArea: string;
  targetMap: string;
  targetTile: readonly [number, number];
}

export function applyInterPrefectureArrival(
  prev: GameState,
  world: World,
  arrival: InterPrefectureArrival,
  now = Date.now(),
): GameState {
  const islands = world.islands.filter((island) => island.areas.includes(arrival.targetArea));
  if (islands.length !== 1)
    throw new Error(
      `${arrival.targetArea}: world上の所属地方が${islands.length === 0 ? 'ありません' : '一意ではありません'}`,
    );

  const location = {
    currentIsland: islands[0]!.id,
    currentArea: arrival.targetArea,
    currentMap: arrival.targetMap,
    position: {
      x: arrival.targetTile[0] * TILE_SIZE,
      y: arrival.targetTile[1] * TILE_SIZE,
    },
  };
  const devAll = Boolean(prev.progress.counters[DEV_ALL_KEY]);
  const visitKey = `visit:${arrival.targetMap}`;
  const arrivalKey = interPrefectureArrivalKey(arrival.targetArea);

  return {
    ...prev,
    updatedAt: now,
    progress: {
      ...prev.progress,
      ...location,
      ...(devAll
        ? {}
        : {
            counters: {
              ...prev.progress.counters,
              [visitKey]: prev.progress.counters[visitKey] || 1,
              [arrivalKey]: 1,
            },
          }),
    },
  };
}
