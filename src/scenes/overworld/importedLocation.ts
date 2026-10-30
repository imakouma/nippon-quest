import type { GameState } from '../../core/state/schema';
import { groundOfTile, isRoadTile } from '../../core/world/ground';
import { availableResumeMaps } from './fieldMapCatalog';

interface ImportedProgressLocation {
  currentIsland: string;
  currentArea: string;
  currentMap: string;
  lastInn?: { map: string } | null;
}

interface AreaLocation {
  id: string;
  island: string;
  mapKeys?: {
    field: string;
    town: string;
    dungeon: string;
  };
  secret?: unknown;
}

interface EnclaveLocation {
  prefId: string;
  enclaveId: string;
}

interface SpawnObject {
  name?: string;
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface SpawnResolutionInput {
  spawnTile: readonly [number, number] | null;
  exactSpawn: boolean;
  width: number;
  height: number;
  fieldGroundRequired: boolean;
  terrainAt(x: number, y: number): number | undefined;
  blocked(x: number, y: number): boolean;
  objects: readonly SpawnObject[];
  spawnName: string;
}

const UNSAFE_EXACT_SPAWN_OBJECT_TYPES = new Set([
  'transition',
  'interPrefectureLink',
  'npc',
  'chest',
  'midboss',
  'regionGate',
  'structure',
  'regionBoss',
  'boss',
  'lastboss',
  'specialty',
]);

function overlapsUnsafeObject(objects: readonly SpawnObject[], x: number, y: number): boolean {
  return objects.some((object) => {
    if (!object.type || !UNSAFE_EXACT_SPAWN_OBJECT_TYPES.has(object.type)) return false;
    const objectX = object.x ?? 0;
    const objectY = object.y ?? 0;
    const width = object.width && object.width > 0 ? object.width : 16;
    const height = object.height && object.height > 0 ? object.height : 16;
    return (
      x >= Math.floor(objectX / 16) &&
      x < Math.ceil((objectX + width) / 16) &&
      y >= Math.floor(objectY / 16) &&
      y < Math.ceil((objectY + height) / 16)
    );
  });
}

/** セーブ由来の座標をそのまま使っても、マップ外や壁内に出ないか調べる。 */
export function isExactSpawnValid(
  [x, y]: readonly [number, number],
  width: number,
  height: number,
  blocked: boolean,
  hasWalkableTerrain = true,
): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height &&
    !blocked &&
    hasWalkableTerrain
  );
}

/** フィールドで保存位置として復帰できる地面か。海・県外のマスは復帰先にしない。 */
export function isSavedFieldTileWalkable(tile: number | undefined): boolean {
  return groundOfTile(tile) !== null || isRoadTile(tile);
}

/** 保存座標・地図ワープ・マップ既定地点の優先順で、安全な出現位置を決める。 */
export function resolveSpawn(input: SpawnResolutionInput): { tile: [number, number]; faceUp: boolean } {
  if (input.spawnTile) {
    const [tx, ty] = input.spawnTile;
    if (
      input.exactSpawn &&
      isExactSpawnValid(
        input.spawnTile,
        input.width,
        input.height,
        input.blocked(tx, ty) || overlapsUnsafeObject(input.objects, tx, ty),
        !input.fieldGroundRequired || isSavedFieldTileWalkable(input.terrainAt(tx, ty)),
      )
    )
      return { tile: [tx, ty], faceUp: false };
    if (!input.exactSpawn) {
      for (const [dx, dy] of [
        [0, 1],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 0],
      ] as const) {
        const tile: [number, number] = [tx + dx, ty + dy];
        if (!input.blocked(...tile)) return { tile, faceUp: dy === 1 };
      }
      return { tile: [tx, ty], faceUp: false };
    }
  }
  const object =
    input.objects.find((candidate) => candidate.name === input.spawnName) ??
    input.objects.find((candidate) => candidate.type === 'spawn' && candidate.name === 'spawn');
  const x = Math.floor((object?.x ?? 96) / 16);
  const offset = object && (object.type === 'transition' || object.name?.startsWith('to_')) ? 16 : 0;
  const y = Math.floor(((object?.y ?? 240) + offset) / 16);
  return {
    tile: [Math.min(Math.max(0, x), input.width - 1), Math.min(Math.max(0, y), input.height - 1)],
    faceUp: false,
  };
}

/** 歩行位置だけを保存し、同じ位置なら元の参照を返して不要な保存を避ける。 */
export function rememberLocationState(
  game: GameState,
  input: {
    mapKey: string;
    areaId: string;
    islandId: string;
    areaExists: boolean;
    x: number;
    y: number;
    now: number;
  },
): GameState {
  const currentArea = input.areaExists ? input.areaId : game.progress.currentArea;
  const currentIsland = input.areaExists ? input.islandId : game.progress.currentIsland;
  if (
    game.progress.currentMap === input.mapKey &&
    game.progress.currentArea === currentArea &&
    game.progress.currentIsland === currentIsland &&
    game.progress.position.x === input.x * 16 &&
    game.progress.position.y === input.y * 16
  )
    return game;
  return {
    ...game,
    updatedAt: input.now,
    progress: {
      ...game.progress,
      currentMap: input.mapKey,
      currentArea,
      currentIsland,
      position: { x: input.x * 16, y: input.y * 16 },
    },
  };
}

/** 貼り付けたセーブの現在地が、読み込み済みコンテンツの実在する場所を指すか調べる。 */
export function isImportedLocationValid(
  progress: ImportedProgressLocation,
  areas: ReadonlyMap<string, AreaLocation>,
  enclaves: readonly EnclaveLocation[],
): boolean {
  const area = areas.get(progress.currentArea);
  if (!area || area.island !== progress.currentIsland) return false;
  if (
    progress.lastInn &&
    ![...areas.values()].some((candidate) => candidate.mapKeys?.town === progress.lastInn?.map)
  )
    return false;

  const areaMaps = area.mapKeys ? Object.values(area.mapKeys) : [];
  if (areaMaps.includes(progress.currentMap)) return true;
  if (area.secret && progress.currentMap === `${area.id}-secret`) return true;
  if (enclaves.some((enclave) => enclave.prefId === area.id && enclave.enclaveId === progress.currentMap))
    return true;
  // 既知の別エリアへは移さない。カタログから消えた未知マップだけは、呼び出し側で安全な field へ戻す。
  return !availableResumeMaps(areas, enclaves).includes(progress.currentMap);
}
