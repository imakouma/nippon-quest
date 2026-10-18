/** 開発者モードの全国移動を、通常の訪問・攻略進行から分離する純粋関数。 */
import type { World } from '../content/schemas';
import type { GameState } from '../state/schema';

export const DEV_ALL_KEY = 'dev:all';
const RETURN_PREFIX = 'dev:return:';
const MAP_PREFIX = `${RETURN_PREFIX}map:`;
const AREA_PREFIX = `${RETURN_PREFIX}area:`;
const ISLAND_PREFIX = `${RETURN_PREFIX}island:`;
const X_KEY = `${RETURN_PREFIX}x`;
const Y_KEY = `${RETURN_PREFIX}y`;

const encodedKey = (prefix: string, value: string): string => `${prefix}${encodeURIComponent(value)}`;

function taggedValue(counters: Readonly<Record<string, number>>, prefix: string): string | null {
  const key = Object.keys(counters).find((candidate) => candidate.startsWith(prefix) && counters[candidate]);
  if (!key) return null;
  try {
    return decodeURIComponent(key.slice(prefix.length));
  } catch {
    return null;
  }
}

function clearDevMetadata(counters: Record<string, number>): void {
  delete counters[DEV_ALL_KEY];
  for (const key of Object.keys(counters)) if (key.startsWith(RETURN_PREFIX)) delete counters[key];
}

function islandForArea(world: World, areaId: string): string | null {
  return world.islands.find((island) => island.areas.includes(areaId))?.id ?? null;
}

/** devを有効にした瞬間の通常位置を、一度だけセーブ内の予約済みcounterへ退避する。 */
export function enableDeveloperTravel(game: GameState, now = Date.now()): GameState {
  if (game.progress.counters[DEV_ALL_KEY]) return game;
  const next = structuredClone(game);
  clearDevMetadata(next.progress.counters);
  next.progress.counters[DEV_ALL_KEY] = 1;
  next.progress.counters[encodedKey(MAP_PREFIX, game.progress.currentMap)] = 1;
  next.progress.counters[encodedKey(AREA_PREFIX, game.progress.currentArea)] = 1;
  next.progress.counters[encodedKey(ISLAND_PREFIX, game.progress.currentIsland)] = 1;
  next.progress.counters[X_KEY] = Math.max(0, Math.round(game.progress.position.x));
  next.progress.counters[Y_KEY] = Math.max(0, Math.round(game.progress.position.y));
  next.updatedAt = now;
  return next;
}

interface ReturnLocation {
  currentIsland: string;
  currentArea: string;
  currentMap: string;
  position: { x: number; y: number };
}

function savedReturnLocation(game: GameState, world: World): ReturnLocation | null {
  const currentMap = taggedValue(game.progress.counters, MAP_PREFIX);
  const currentArea = taggedValue(game.progress.counters, AREA_PREFIX);
  const currentIsland = taggedValue(game.progress.counters, ISLAND_PREFIX);
  const x = game.progress.counters[X_KEY];
  const y = game.progress.counters[Y_KEY];
  if (
    !currentMap ||
    !currentArea ||
    !currentIsland ||
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    !Number.isSafeInteger(x) ||
    !Number.isSafeInteger(y) ||
    islandForArea(world, currentArea) !== currentIsland
  )
    return null;
  return { currentMap, currentArea, currentIsland, position: { x, y } };
}

function legacyReturnLocation(game: GameState, world: World): ReturnLocation {
  const currentIsland = islandForArea(world, game.progress.currentArea);
  if (
    currentIsland &&
    game.progress.currentMap === `${game.progress.currentArea}-field` &&
    game.progress.counters[`visit:${game.progress.currentMap}`]
  )
    return {
      currentIsland,
      currentArea: game.progress.currentArea,
      currentMap: game.progress.currentMap,
      position: { ...game.progress.position },
    };

  const islands = [...world.islands]
    .filter((island) => island.status === 'playable')
    .sort((a, b) => a.order - b.order);
  for (const island of islands)
    for (const areaId of island.areas) {
      const mapKey = `${areaId}-field`;
      if (game.progress.counters[`visit:${mapKey}`])
        return {
          currentIsland: island.id,
          currentArea: areaId,
          currentMap: mapKey,
          position: { x: 0, y: 0 },
        };
    }

  const firstIsland = islands[0] ?? world.islands[0];
  const firstArea = firstIsland?.areas[0] ?? 'aomori';
  return {
    currentIsland: firstIsland?.id ?? 'tohoku',
    currentArea: firstArea,
    currentMap: `${firstArea}-field`,
    position: { x: 0, y: 0 },
  };
}

/** devを切ると退避位置へ戻す。旧セーブは訪問済みフィールドから決定論的に復旧する。 */
export function disableDeveloperTravel(game: GameState, world: World, now = Date.now()): GameState {
  const location = savedReturnLocation(game, world) ?? legacyReturnLocation(game, world);
  const next = structuredClone(game);
  clearDevMetadata(next.progress.counters);
  Object.assign(next.progress, location);
  next.updatedAt = now;
  return next;
}

export interface DeveloperTravelToggle {
  enabled: boolean;
  game: GameState;
  targetMap: string;
  targetTile: [number, number];
}

/** UIが切替後の復帰先を再計算しないよう、状態と再読込先を一緒に返す。 */
export function toggleDeveloperTravel(
  game: GameState,
  world: World,
  currentMap: string,
  currentTile: [number, number],
): DeveloperTravelToggle {
  const enabled = !game.progress.counters[DEV_ALL_KEY];
  const next = enabled ? enableDeveloperTravel(game) : disableDeveloperTravel(game, world);
  return {
    enabled,
    game: next,
    targetMap: enabled ? currentMap : next.progress.currentMap,
    targetTile: enabled
      ? currentTile
      : [Math.floor(next.progress.position.x / 16), Math.floor(next.progress.position.y / 16)],
  };
}
