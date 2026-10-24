import type { MapTransitionRequest } from './mapTransitionPipeline';

export type MapEntryFacing = 'down' | 'left' | 'right' | 'up';
export type MapEntrySource =
  'exact-tile' | 'map-tile' | 'named-spawn' | 'saved-position' | 'default-spawn' | 'fallback';

export interface MapEntry {
  x: number;
  y: number;
  facing: MapEntryFacing;
  source: MapEntrySource;
}

export interface MapEntryObject {
  name: string;
  type: string;
  x?: number;
  y?: number;
}

export interface MapEntryMap {
  key: string;
  width: number;
  height: number;
  objects: readonly MapEntryObject[];
  isWalkable(x: number, y: number): boolean;
  tileSize?: number;
}

export interface SavedMapEntry {
  mapKey: string;
  x: number;
  y: number;
  facing?: MapEntryFacing;
}

export interface ResolveMapEntryInput {
  request: MapTransitionRequest;
  map: MapEntryMap;
  saved?: SavedMapEntry;
}

const DEFAULT_FACING: MapEntryFacing = 'down';

export function resolveMapEntry({ request, map, saved }: ResolveMapEntryInput): MapEntry {
  const valid = (x: number, y: number): boolean =>
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x < map.width &&
    y < map.height &&
    map.isWalkable(x, y);
  const entry = (x: number, y: number, facing: MapEntryFacing, source: MapEntrySource): MapEntry | null =>
    valid(x, y) ? { x, y, facing, source } : null;

  if (request.targetMap === map.key && request.tile) {
    const [x, y] = request.tile;
    if (request.exactSpawn) {
      const exact = entry(x, y, DEFAULT_FACING, 'exact-tile');
      if (exact) return exact;
    } else {
      const offsets = [
        [0, 1, 'up'],
        [-1, 0, DEFAULT_FACING],
        [1, 0, DEFAULT_FACING],
        [0, -1, DEFAULT_FACING],
        [0, 0, DEFAULT_FACING],
      ] as const;
      for (const [dx, dy, facing] of offsets) {
        const beside = entry(x + dx, y + dy, facing, 'map-tile');
        if (beside) return beside;
      }
    }
  }

  if (request.targetMap === map.key && request.spawnName) {
    const named = entryFromObject(
      map.objects.find((object) => object.name === request.spawnName),
      map,
      'named-spawn',
      entry,
    );
    if (named) return named;
  }

  if (saved?.mapKey === map.key) {
    const restored = entry(saved.x, saved.y, saved.facing ?? DEFAULT_FACING, 'saved-position');
    if (restored) return restored;
  }

  const defaultSpawn = entryFromObject(
    map.objects.find((object) => object.name === 'spawn' && object.type === 'spawn'),
    map,
    'default-spawn',
    entry,
  );
  if (defaultSpawn) return defaultSpawn;

  for (let y = 0; y < map.height; y += 1)
    for (let x = 0; x < map.width; x += 1) {
      const fallback = entry(x, y, DEFAULT_FACING, 'fallback');
      if (fallback) return fallback;
    }

  throw new Error(`${map.key} has no walkable entry`);
}

function entryFromObject(
  object: MapEntryObject | undefined,
  map: MapEntryMap,
  source: 'named-spawn' | 'default-spawn',
  entry: (x: number, y: number, facing: MapEntryFacing, source: MapEntrySource) => MapEntry | null,
): MapEntry | null {
  if (!object) return null;
  const tileSize = map.tileSize ?? 16;
  const x = Math.floor((object.x ?? 0) / tileSize);
  const transitionOffset = object.type === 'transition' || object.name.startsWith('to_') ? 1 : 0;
  const y = Math.floor((object.y ?? 0) / tileSize) + transitionOffset;
  return entry(x, y, DEFAULT_FACING, source);
}
