import { isSavedFieldTileWalkable } from './importedLocation';
import { resolveMapEntry, type MapEntry, type MapEntryFacing, type MapEntryObject } from './mapEntry';
import type { MapTransitionRequest } from './mapTransitionPipeline';

export interface LegacyMapSceneEntryData {
  mapKey?: string;
  spawnName?: string;
  spawnTile?: readonly [number, number];
  exactSpawn?: boolean;
  transitionRequest?: MapTransitionRequest;
}

export function mapTransitionRequestFromSceneData(
  data: LegacyMapSceneEntryData | undefined,
  fallbackMap: string,
): MapTransitionRequest {
  if (data?.transitionRequest) return data.transitionRequest;
  return {
    targetMap: data?.mapKey ?? fallbackMap,
    spawnName: data?.spawnName ?? 'spawn',
    ...(data?.spawnTile ? { tile: data.spawnTile } : {}),
    ...(data?.exactSpawn ? { exactSpawn: true } : {}),
    reason: 'script',
  };
}

export function resolveOverworldMapEntry(input: {
  request: MapTransitionRequest;
  key: string;
  width: number;
  height: number;
  objects: readonly MapEntryObject[];
  isBlocked(x: number, y: number): boolean;
  terrainAt(x: number, y: number): number | undefined;
  fieldGroundRequired: boolean;
  saved?: {
    currentMap: string;
    position: { x: number; y: number };
    fieldSnapshot?: { facing: MapEntryFacing };
  };
}): MapEntry {
  return resolveMapEntry({
    request: input.request,
    map: {
      key: input.key,
      width: input.width,
      height: input.height,
      objects: input.objects,
      isWalkable: (x, y) =>
        !input.isBlocked(x, y) &&
        (!input.fieldGroundRequired || isSavedFieldTileWalkable(input.terrainAt(x, y))),
      tileSize: 16,
    },
    ...(input.saved
      ? {
          saved: {
            mapKey: input.saved.currentMap,
            x: Math.floor(input.saved.position.x / 16),
            y: Math.floor(input.saved.position.y / 16),
            facing: input.saved.fieldSnapshot?.facing,
          },
        }
      : {}),
  });
}
