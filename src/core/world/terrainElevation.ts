export const ELEVATION_UNIT_PX = 4;
export const MAX_STEP_ELEVATION_DELTA = 1;
export const FIELD_ELEVATION_DATA_KEY = 'fieldElevation';

export interface TerrainElevation {
  width: number;
  height: number;
  tiles: readonly number[];
}

export interface TiledElevationObject {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  properties?: readonly { name?: string; value?: unknown }[];
}

const nonnegativeInteger = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0;

export function terrainElevationFromObjects(
  width: number,
  height: number,
  tileSize: number,
  objects: readonly TiledElevationObject[] = [],
): TerrainElevation {
  const safeWidth = Number.isInteger(width) && width > 0 ? width : 0;
  const safeHeight = Number.isInteger(height) && height > 0 ? height : 0;
  const tiles = Array<number>(safeWidth * safeHeight).fill(0);
  if (!(tileSize > 0)) return { width: safeWidth, height: safeHeight, tiles };

  for (const object of objects) {
    const elevation = object.properties?.find((property) => property.name === 'elevation')?.value;
    if (!nonnegativeInteger(elevation)) continue;
    const { x, y, width: objectWidth, height: objectHeight } = object;
    if (![x, y, objectWidth, objectHeight].every(Number.isFinite) || objectWidth! <= 0 || objectHeight! <= 0)
      continue;
    const left = Math.max(0, Math.floor(x! / tileSize));
    const top = Math.max(0, Math.floor(y! / tileSize));
    const right = Math.min(safeWidth, Math.ceil((x! + objectWidth!) / tileSize));
    const bottom = Math.min(safeHeight, Math.ceil((y! + objectHeight!) / tileSize));
    for (let tileY = top; tileY < bottom; tileY++)
      for (let tileX = left; tileX < right; tileX++) tiles[tileY * safeWidth + tileX] = elevation;
  }
  return { width: safeWidth, height: safeHeight, tiles };
}

export function elevationAt(elevation: TerrainElevation, x: number, y: number): number {
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= elevation.width ||
    y >= elevation.height
  )
    return 0;
  return elevation.tiles[y * elevation.width + x] ?? 0;
}

export const canTraverseElevation = (from: number, to: number): boolean =>
  Math.abs(to - from) <= MAX_STEP_ELEVATION_DELTA;

export function interpolateElevation(from: number, to: number, progress: number): number {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return from + (to - from) * clamped;
}

export const projectedWorldY = (worldY: number, elevation: number): number =>
  worldY - elevation * ELEVATION_UNIT_PX;
