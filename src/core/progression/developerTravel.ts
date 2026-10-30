/** 開発者モードの全国移動を、通常の訪問・攻略進行から分離する純粋関数。 */
import { ENCLAVES } from '../content/enclaves';
import type { Area, World } from '../content/schemas';
import type { GameState } from '../state/schema';
import { areaReachableForTravel, interPrefectureArrivalKey } from './interPrefecture';
import { allRegionBossesDefeated, areaBossFlag, areaTravelCompleted } from './route';

export const DEV_ALL_KEY = 'dev:all';
const RETURN_PREFIX = 'dev:return:';
const MAP_PREFIX = `${RETURN_PREFIX}map:`;
const AREA_PREFIX = `${RETURN_PREFIX}area:`;
const ISLAND_PREFIX = `${RETURN_PREFIX}island:`;
const X_KEY = `${RETURN_PREFIX}x`;
const Y_KEY = `${RETURN_PREFIX}y`;
const CHECKSUM_KEY = `${RETURN_PREFIX}checksum`;
const QUARANTINE_VISIT_PREFIX = 'dev:quarantine:visit:';
const QUARANTINE_INN_PREFIX = 'dev:quarantine:inn:';

const encodedKey = (prefix: string, value: string): string => `${prefix}${encodeURIComponent(value)}`;

function returnLocationChecksum(location: ReturnLocation): number {
  const value = [
    location.currentIsland,
    location.currentArea,
    location.currentMap,
    location.position.x,
    location.position.y,
  ].join('\0');
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function developerVisitQuarantined(
  counters: Readonly<Record<string, number>>,
  mapKey: string,
): boolean {
  return Boolean(counters[encodedKey(QUARANTINE_VISIT_PREFIX, mapKey)]);
}

export function developerInnQuarantined(counters: Readonly<Record<string, number>>, mapKey: string): boolean {
  return Boolean(counters[encodedKey(QUARANTINE_INN_PREFIX, mapKey)]);
}

export function releaseDeveloperTravelQuarantine(counters: Record<string, number>, mapKey: string): void {
  delete counters[encodedKey(QUARANTINE_VISIT_PREFIX, mapKey)];
  delete counters[encodedKey(QUARANTINE_INN_PREFIX, mapKey)];
}

/** 正規到着で隔離を解除する。入力を変更せず、保存処理が検知できる新しい状態を返す。 */
export function releaseDeveloperTravelQuarantineState(
  game: GameState,
  mapKey: string,
  now = Date.now(),
): GameState {
  if (
    !developerVisitQuarantined(game.progress.counters, mapKey) &&
    !developerInnQuarantined(game.progress.counters, mapKey)
  )
    return game;
  const next = structuredClone(game);
  releaseDeveloperTravelQuarantine(next.progress.counters, mapKey);
  next.updatedAt = now;
  return next;
}

function taggedValue(counters: Readonly<Record<string, number>>, prefix: string): string | null {
  const keys = Object.keys(counters).filter(
    (candidate) => candidate.startsWith(prefix) && counters[candidate],
  );
  if (keys.length !== 1) return null;
  try {
    return decodeURIComponent(keys[0]!.slice(prefix.length));
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

function mapBelongsToArea(mapKey: string, areaId: string): boolean {
  return ['field', 'town', 'dungeon', 'secret'].some((kind) => mapKey === `${areaId}-${kind}`);
}

function canonicalMapBelongsToArea(mapKey: string, areaId: string): boolean {
  return (
    mapBelongsToArea(mapKey, areaId) ||
    ENCLAVES.some((enclave) => enclave.prefId === areaId && enclave.enclaveId === mapKey)
  );
}

/** devを有効にした瞬間の通常位置を、一度だけセーブ内の予約済みcounterへ退避する。 */
export function enableDeveloperTravel(game: GameState, now = Date.now()): GameState {
  if (game.progress.counters[DEV_ALL_KEY]) return game;
  const next = structuredClone(game);
  const exactReturn = canonicalMapBelongsToArea(game.progress.currentMap, game.progress.currentArea);
  const returnMap = exactReturn ? game.progress.currentMap : `${game.progress.currentArea}-field`;
  const returnLocation: ReturnLocation = {
    currentMap: returnMap,
    currentArea: game.progress.currentArea,
    currentIsland: game.progress.currentIsland,
    position: exactReturn
      ? {
          x: Math.max(0, Math.round(game.progress.position.x)),
          y: Math.max(0, Math.round(game.progress.position.y)),
        }
      : { x: 0, y: 0 },
  };
  clearDevMetadata(next.progress.counters);
  next.progress.counters[DEV_ALL_KEY] = 1;
  next.progress.counters[encodedKey(MAP_PREFIX, returnLocation.currentMap)] = 1;
  next.progress.counters[encodedKey(AREA_PREFIX, returnLocation.currentArea)] = 1;
  next.progress.counters[encodedKey(ISLAND_PREFIX, returnLocation.currentIsland)] = 1;
  next.progress.counters[X_KEY] = returnLocation.position.x;
  next.progress.counters[Y_KEY] = returnLocation.position.y;
  next.progress.counters[CHECKSUM_KEY] = returnLocationChecksum(returnLocation);
  next.updatedAt = now;
  return next;
}

interface ReturnLocation {
  currentIsland: string;
  currentArea: string;
  currentMap: string;
  position: { x: number; y: number };
}

type DeveloperTravelAreas = ReadonlyMap<string, Pick<Area, 'regions'>>;

function savedReturnLocation(game: GameState, world: World): ReturnLocation | null {
  const currentMap = taggedValue(game.progress.counters, MAP_PREFIX);
  const currentArea = taggedValue(game.progress.counters, AREA_PREFIX);
  const currentIsland = taggedValue(game.progress.counters, ISLAND_PREFIX);
  const x = game.progress.counters[X_KEY];
  const y = game.progress.counters[Y_KEY];
  const checksum = game.progress.counters[CHECKSUM_KEY];
  if (
    !currentMap ||
    !currentArea ||
    !currentIsland ||
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    !Number.isSafeInteger(x) ||
    !Number.isSafeInteger(y) ||
    x < 0 ||
    y < 0 ||
    !canonicalMapBelongsToArea(currentMap, currentArea) ||
    islandForArea(world, currentArea) !== currentIsland
  )
    return null;
  const location = { currentMap, currentArea, currentIsland, position: { x, y } };
  return checksum === returnLocationChecksum(location) ? location : null;
}

function firstPlayableReturnLocation(world: World): ReturnLocation {
  const islands = [...world.islands]
    .filter((island) => island.status === 'playable')
    .sort((a, b) => a.order - b.order);
  const firstIsland = islands[0] ?? world.islands[0];
  const firstArea = firstIsland?.areas[0] ?? 'aomori';
  return {
    currentIsland: firstIsland?.id ?? 'tohoku',
    currentArea: firstArea,
    currentMap: `${firstArea}-field`,
    position: { x: 0, y: 0 },
  };
}

function normalLocationAvailable(game: GameState, world: World, location: ReturnLocation): boolean {
  return (
    islandForArea(world, location.currentArea) === location.currentIsland &&
    canonicalMapBelongsToArea(location.currentMap, location.currentArea) &&
    Number.isSafeInteger(location.position.x) &&
    Number.isSafeInteger(location.position.y) &&
    location.position.x >= 0 &&
    location.position.y >= 0 &&
    areaReachableForTravel(world, location.currentArea, game.progress)
  );
}

function areaForMap(world: World, mapKey: string): string | null {
  for (const island of world.islands)
    for (const areaId of island.areas) if (canonicalMapBelongsToArea(mapKey, areaId)) return areaId;
  return null;
}

function mapTravelRank(world: World, areaId: string, mapKey: string): number {
  const island = world.islands.find((candidate) => candidate.areas.includes(areaId));
  const areaIndex = island?.areas.indexOf(areaId) ?? -1;
  const kindRank = mapKey.endsWith('-field')
    ? 0
    : mapKey.endsWith('-town')
      ? 1
      : mapKey.endsWith('-dungeon')
        ? 2
        : mapKey.endsWith('-secret')
          ? 3
          : 4;
  return (island?.order ?? -1) * 1000 + areaIndex * 10 + kindRank;
}

/** 隔離されていない正規訪問先のうち、最も先へ進んだ安全な場所へ決定的に戻す。 */
function visitedReturnLocation(game: GameState, world: World): ReturnLocation {
  const candidates = Object.entries(game.progress.counters)
    .filter(([key, count]) => key.startsWith('visit:') && count > 0)
    .flatMap(([key]) => {
      const currentMap = key.slice('visit:'.length);
      if (developerVisitQuarantined(game.progress.counters, currentMap)) return [];
      const currentArea = areaForMap(world, currentMap);
      const currentIsland = currentArea ? islandForArea(world, currentArea) : null;
      if (!currentArea || !currentIsland) return [];
      const inn = game.progress.lastInn;
      const position =
        inn?.map === currentMap && !developerInnQuarantined(game.progress.counters, currentMap)
          ? { x: inn.x, y: inn.y }
          : { x: 0, y: 0 };
      const location: ReturnLocation = { currentIsland, currentArea, currentMap, position };
      return normalLocationAvailable(game, world, location) ? [location] : [];
    })
    .sort(
      (a, b) =>
        mapTravelRank(world, a.currentArea, a.currentMap) -
          mapTravelRank(world, b.currentArea, b.currentMap) || a.currentMap.localeCompare(b.currentMap),
    );
  return candidates.at(-1) ?? firstPlayableReturnLocation(world);
}

function currentMapHasNormalProvenance(
  game: GameState,
  world: World,
  location: ReturnLocation,
  requirePhysicalArrival: boolean,
): boolean {
  const first = firstPlayableReturnLocation(world);
  const firstArea = location.currentArea === first.currentArea;
  const completed = areaTravelCompleted(game.progress, location.currentArea);
  const physicallyArrived = Boolean(game.progress.counters[interPrefectureArrivalKey(location.currentArea)]);
  return (
    completed ||
    (Boolean(game.progress.counters[`visit:${location.currentMap}`]) &&
      !developerVisitQuarantined(game.progress.counters, location.currentMap) &&
      (!requirePhysicalArrival || firstArea || physicallyArrived)) ||
    (firstArea && location.currentIsland === first.currentIsland && location.currentMap === first.currentMap)
  );
}

/** visitを残さない旧dev移動で、県だけ解放済みの未訪問マップへ居続けるのを防ぐ。 */
function recoverableCurrentAvailable(
  game: GameState,
  world: World,
  location: ReturnLocation,
  areas?: DeveloperTravelAreas,
): boolean {
  if (
    !normalLocationAvailable(game, world, location) ||
    !currentMapHasNormalProvenance(game, world, location, false)
  )
    return false;
  return restrictedMapProgressComplete(game, location.currentMap, location.currentArea, areas);
}

function restrictedMapProgressComplete(
  game: GameState,
  mapKey: string,
  areaId: string,
  areas?: DeveloperTravelAreas,
): boolean {
  if (mapKey.endsWith('-secret'))
    return (
      game.progress.areaSigns.includes(areaId) || game.progress.eventsDone.includes(areaBossFlag(areaId))
    );
  if (mapKey.endsWith('-dungeon')) {
    const area = areas?.get(areaId);
    if (!area) return areaTravelCompleted(game.progress, areaId);
    const required = area.regions.filter((region) => region.boss).map((region) => region.id);
    return allRegionBossesDefeated(game.progress, areaId, required);
  }
  return true;
}

/** 退避情報のない旧devでは、未攻略ダンジョン・裏ステージを通常位置として信用しない。 */
function legacyCurrentAvailable(
  game: GameState,
  world: World,
  location: ReturnLocation,
  areas?: DeveloperTravelAreas,
): boolean {
  return (
    normalLocationAvailable(game, world, location) &&
    currentMapHasNormalProvenance(game, world, location, true) &&
    restrictedMapProgressComplete(game, location.currentMap, location.currentArea, areas)
  );
}

/** dev由来か判別できない履歴を削除せず隔離し、正規到着まで利用不能にする。 */
function quarantineUnsafeDeveloperTravelArtifacts(
  game: GameState,
  world: World,
  strictAreaMaps: boolean,
  areas?: DeveloperTravelAreas,
): boolean {
  let changed = false;
  const firstArea = firstPlayableReturnLocation(world).currentArea;
  for (const key of Object.keys(game.progress.counters)) {
    if (!key.startsWith('visit:')) continue;
    const areaId = areaForMap(world, key.slice('visit:'.length));
    const mapKey = key.slice('visit:'.length);
    const invalidRestrictedMap =
      (mapKey.endsWith('-secret') || mapKey.endsWith('-dungeon')) &&
      !restrictedMapProgressComplete(game, mapKey, areaId ?? '', areas);
    const unverifiedAreaEntry =
      strictAreaMaps &&
      !!areaId &&
      areaId !== firstArea &&
      !areaTravelCompleted(game.progress, areaId) &&
      !game.progress.counters[interPrefectureArrivalKey(areaId)];
    if (
      !areaId ||
      !areaReachableForTravel(world, areaId, game.progress) ||
      invalidRestrictedMap ||
      unverifiedAreaEntry
    ) {
      const quarantineKey = encodedKey(QUARANTINE_VISIT_PREFIX, mapKey);
      if (!game.progress.counters[quarantineKey]) {
        game.progress.counters[quarantineKey] = 1;
        changed = true;
      }
    }
  }
  const innArea = game.progress.lastInn && areaForMap(world, game.progress.lastInn.map);
  const unverifiedInn =
    strictAreaMaps &&
    !!innArea &&
    innArea !== firstArea &&
    !areaTravelCompleted(game.progress, innArea) &&
    !game.progress.counters[interPrefectureArrivalKey(innArea)];
  if (
    game.progress.lastInn &&
    (!innArea || !areaReachableForTravel(world, innArea, game.progress) || unverifiedInn)
  ) {
    const quarantineKey = encodedKey(QUARANTINE_INN_PREFIX, game.progress.lastInn.map);
    if (!game.progress.counters[quarantineKey]) {
      game.progress.counters[quarantineKey] = 1;
      changed = true;
    }
  }
  return changed;
}

/** devを切ると退避位置へ戻す。退避情報のない旧セーブは安全な開始県へ復旧する。 */
export function disableDeveloperTravel(
  game: GameState,
  world: World,
  now = Date.now(),
  areas?: DeveloperTravelAreas,
): GameState {
  const saved = savedReturnLocation(game, world);
  const safeSaved = saved && normalLocationAvailable(game, world, saved) ? saved : null;
  const hasReturnMetadata = Object.keys(game.progress.counters).some((key) => key.startsWith(RETURN_PREFIX));
  const current: ReturnLocation = {
    currentIsland: game.progress.currentIsland,
    currentArea: game.progress.currentArea,
    currentMap: game.progress.currentMap,
    position: game.progress.position,
  };
  const safeLegacyCurrent =
    !hasReturnMetadata && legacyCurrentAvailable(game, world, current, areas) ? current : null;
  const next = structuredClone(game);
  clearDevMetadata(next.progress.counters);
  if (!safeSaved) quarantineUnsafeDeveloperTravelArtifacts(next, world, true, areas);
  const location = safeSaved ?? safeLegacyCurrent ?? visitedReturnLocation(next, world);
  Object.assign(next.progress, location);
  next.updatedAt = now;
  return next;
}

/** devの保存フラグは、開発者向け操作を表示できる環境でだけ有効にする。 */
export function developerTravelActive(game: GameState | null | undefined, available: boolean): boolean {
  return !!game && available && (game.progress.counters[DEV_ALL_KEY] ?? 0) > 0;
}

/** 公開環境へ持ち込まれたdevセーブは、退避済みの通常位置へ戻してから読み込む。 */
export function normalizeUnavailableDeveloperTravel(
  game: GameState,
  world: World,
  available: boolean,
  now = Date.now(),
  areas?: DeveloperTravelAreas,
): GameState {
  if (developerTravelActive(game, available)) return game;
  const normalized = game.progress.counters[DEV_ALL_KEY]
    ? disableDeveloperTravel(game, world, now, areas)
    : game;
  const quarantined = structuredClone(normalized);
  const changed = quarantineUnsafeDeveloperTravelArtifacts(quarantined, world, false, areas);
  const safe = changed ? quarantined : normalized;
  const current: ReturnLocation = {
    currentIsland: safe.progress.currentIsland,
    currentArea: safe.progress.currentArea,
    currentMap: safe.progress.currentMap,
    position: safe.progress.position,
  };
  if (recoverableCurrentAvailable(safe, world, current, areas)) {
    if (changed) safe.updatedAt = now;
    return safe;
  }
  const recovered = structuredClone(safe);
  quarantineUnsafeDeveloperTravelArtifacts(recovered, world, true, areas);
  Object.assign(recovered.progress, visitedReturnLocation(recovered, world));
  recovered.updatedAt = now;
  return recovered;
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
  areas?: DeveloperTravelAreas,
): DeveloperTravelToggle {
  const enabled = !game.progress.counters[DEV_ALL_KEY];
  const next = enabled ? enableDeveloperTravel(game) : disableDeveloperTravel(game, world, Date.now(), areas);
  return {
    enabled,
    game: next,
    targetMap: enabled ? currentMap : next.progress.currentMap,
    targetTile: enabled
      ? currentTile
      : [Math.floor(next.progress.position.x / 16), Math.floor(next.progress.position.y / 16)],
  };
}
