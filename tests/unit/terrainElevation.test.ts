import { describe, expect, it } from 'vitest';
import {
  canTraverseElevation,
  elevationAt,
  interpolateElevation,
  projectedWorldY,
  terrainElevationFromObjects,
} from '../../src/core/world/terrainElevation';

const elevationObject = (
  elevation: unknown,
  x = 16,
  y = 16,
  width = 16,
  height = 16,
) => ({
  x,
  y,
  width,
  height,
  properties: [{ name: 'elevation', value: elevation }],
});

describe('terrain elevation', () => {
  it('rasterizes rectangular Tiled objects to integer tile heights without mutating the input', () => {
    const objects = [elevationObject(4, 16, 16, 32, 16), elevationObject(2, 32, 16)];
    const original = structuredClone(objects);
    const elevation = terrainElevationFromObjects(4, 3, 16, objects);

    expect(elevation.tiles).toEqual([
      0, 0, 0, 0,
      0, 4, 2, 0,
      0, 0, 0, 0,
    ]);
    expect(objects).toEqual(original);
  });

  it('uses flat zero for missing, malformed, non-integer, negative, and out-of-bounds data', () => {
    const elevation = terrainElevationFromObjects(2, 2, 16, [
      elevationObject(-1, 0, 0),
      elevationObject(1.5, 16, 0),
      elevationObject('4', 0, 16),
      elevationObject(3, 200, 200),
      { x: 0, y: 0, width: 16, height: 16 },
    ]);

    expect(elevation.tiles).toEqual([0, 0, 0, 0]);
    expect(elevationAt(elevation, -1, 0)).toBe(0);
    expect(elevationAt(elevation, 2, 2)).toBe(0);
  });

  it('allows one-unit steps, blocks larger differences, and interpolates projected height', () => {
    expect(canTraverseElevation(0, 1)).toBe(true);
    expect(canTraverseElevation(4, 3)).toBe(true);
    expect(canTraverseElevation(0, 2)).toBe(false);
    expect(interpolateElevation(4, 2, 0.25)).toBe(3.5);
    expect(interpolateElevation(4, 2, -1)).toBe(4);
    expect(interpolateElevation(4, 2, 2)).toBe(2);
    expect(projectedWorldY(120, 4)).toBe(104);
  });
});
