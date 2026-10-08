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
  return enclaves.some((enclave) => enclave.prefId === area.id && enclave.enclaveId === progress.currentMap);
}
import { groundOfTile, isRoadTile } from '../../core/world/ground';
