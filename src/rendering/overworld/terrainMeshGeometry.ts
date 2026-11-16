import { ELEVATION_UNIT_PX, elevationAt, type TerrainElevation } from '../../core/world/terrainElevation';
import type { Field3dPoint } from './field3dProjection';

export interface TerrainBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TerrainTopTriangle {
  tileId: number;
  vertices: [Field3dPoint, Field3dPoint, Field3dPoint];
}

export interface TerrainFaceTriangle {
  side: 'south' | 'east' | 'west';
  vertices: [Field3dPoint, Field3dPoint, Field3dPoint];
}

export interface TerrainGeometry {
  tops: TerrainTopTriangle[];
  faces: TerrainFaceTriangle[];
}

export const shouldRenderTerrainProp = (x: number, y: number, blocked: boolean): boolean =>
  blocked || (x + y) % 2 === 0;

/** Recovers the ground point from the elevation-offset 2D anchor used by existing field sprites. */
export function fieldPointForBillboard(
  elevation: TerrainElevation,
  tileSize: number,
  x: number,
  displayedY: number,
  appliedElevation?: number,
): Field3dPoint {
  if (appliedElevation !== undefined) {
    const height = appliedElevation * ELEVATION_UNIT_PX;
    return { x, height, z: displayedY + height };
  }
  const tileX = Math.floor(x / tileSize);
  const tileY = Math.floor(displayedY / tileSize);
  return {
    x,
    height: elevationAt(elevation, tileX, tileY) * ELEVATION_UNIT_PX,
    z: displayedY,
  };
}

const point = (x: number, z: number, elevation: number): Field3dPoint => ({
  x,
  height: elevation * ELEVATION_UNIT_PX,
  z,
});

export function buildTerrainGeometry(
  tileIds: readonly number[],
  elevation: TerrainElevation,
  tileSize: number,
  bounds: TerrainBounds,
): TerrainGeometry {
  const tops: TerrainTopTriangle[] = [];
  const faces: TerrainFaceTriangle[] = [];
  const endX = Math.min(elevation.width, bounds.x + bounds.width);
  const endY = Math.min(elevation.height, bounds.y + bounds.height);

  const addFace = (
    side: TerrainFaceTriangle['side'],
    topA: Field3dPoint,
    topB: Field3dPoint,
    bottomA: Field3dPoint,
    bottomB: Field3dPoint,
  ) => {
    const courses = Math.max(1, Math.round((topA.height - bottomA.height) / ELEVATION_UNIT_PX));
    for (let course = 0; course < courses; course++) {
      const high = topA.height - course * ELEVATION_UNIT_PX;
      const low = Math.max(bottomA.height, high - ELEVATION_UNIT_PX);
      const a = { ...topA, height: high };
      const b = { ...topB, height: high };
      const c = { ...bottomA, height: low };
      const d = { ...bottomB, height: low };
      faces.push({ side, vertices: [a, b, c] }, { side, vertices: [c, b, d] });
    }
  };

  for (let y = Math.max(0, bounds.y); y < endY; y++) {
    for (let x = Math.max(0, bounds.x); x < endX; x++) {
      const tileId = tileIds[y * elevation.width + x] ?? -1;
      if (tileId < 0) continue;
      const level = elevationAt(elevation, x, y);
      const x0 = x * tileSize;
      const x1 = x0 + tileSize;
      const z0 = y * tileSize;
      const z1 = z0 + tileSize;
      const nw = point(x0, z0, level);
      const ne = point(x1, z0, level);
      const sw = point(x0, z1, level);
      const se = point(x1, z1, level);
      tops.push({ tileId, vertices: [nw, sw, ne] }, { tileId, vertices: [ne, sw, se] });

      if (y + 1 < elevation.height) {
        const lower = elevationAt(elevation, x, y + 1);
        if (level > lower) addFace('south', sw, se, point(x0, z1, lower), point(x1, z1, lower));
      }
      if (x + 1 < elevation.width) {
        const lower = elevationAt(elevation, x + 1, y);
        if (level > lower) addFace('east', ne, se, point(x1, z0, lower), point(x1, z1, lower));
      }
      if (x > 0) {
        const lower = elevationAt(elevation, x - 1, y);
        if (level > lower) addFace('west', nw, sw, point(x0, z0, lower), point(x0, z1, lower));
      }
    }
  }

  return { tops, faces };
}
