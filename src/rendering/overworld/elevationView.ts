import {
  ELEVATION_UNIT_PX,
  elevationAt,
  type TerrainElevation,
} from '../../core/world/terrainElevation';

export interface ElevationViewBand {
  elevation: number;
  offsetY: number;
  tiles: number[];
}

export interface ElevationFace {
  x: number;
  y: number;
  height: number;
  style: 'cliff' | 'stairs';
}

export interface ElevationView {
  bands: ElevationViewBand[];
  faces: ElevationFace[];
}

const STAIRS_TILE = 306;

export function buildElevationView(
  tileIds: readonly number[],
  elevation: TerrainElevation,
  tileSize: number,
): ElevationView {
  const cellCount = elevation.width * elevation.height;
  const levels = [...new Set(elevation.tiles)].sort((a, b) => a - b);
  const bands = levels.map((level) => ({
    elevation: level,
    offsetY: level === 0 ? 0 : -level * ELEVATION_UNIT_PX,
    tiles: Array.from({ length: cellCount }, (_, index) =>
      elevation.tiles[index] === level ? (tileIds[index] ?? -1) : -1,
    ),
  }));
  const faces: ElevationFace[] = [];
  for (let y = 0; y < elevation.height - 1; y++) {
    for (let x = 0; x < elevation.width; x++) {
      const upper = elevationAt(elevation, x, y);
      const lower = elevationAt(elevation, x, y + 1);
      if (upper <= lower) continue;
      const index = y * elevation.width + x;
      faces.push({
        x: x * tileSize,
        y: (y + 1) * tileSize - upper * ELEVATION_UNIT_PX,
        height: (upper - lower) * ELEVATION_UNIT_PX,
        style:
          tileIds[index] === STAIRS_TILE || tileIds[index + elevation.width] === STAIRS_TILE
            ? 'stairs'
            : 'cliff',
      });
    }
  }
  return { bands, faces };
}
