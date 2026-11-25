import { describe, expect, it } from 'vitest';
import type { TerrainElevation } from '../../src/core/world/terrainElevation';
import {
  buildTerrainGeometry,
  fieldPointForBillboard,
  shouldRenderTerrainProp,
} from '../../src/rendering/overworld/terrainMeshGeometry';

const elevation = (width: number, height: number, tiles: number[]): TerrainElevation => ({
  width,
  height,
  tiles,
});

describe('terrain mesh geometry', () => {
  it('thins decorative props without hiding blocked props', () => {
    expect(shouldRenderTerrainProp(1, 0, false)).toBe(false);
    expect(shouldRenderTerrainProp(1, 0, true)).toBe(true);
    expect(shouldRenderTerrainProp(2, 0, false)).toBe(true);
  });

  it('recovers a raised billboard ground point without changing its stored 2D anchor', () => {
    const terrain = elevation(2, 3, [0, 0, 0, 0, 0, 4]);

    expect(fieldPointForBillboard(terrain, 16, 24, 24, 4)).toEqual({ x: 24, height: 16, z: 40 });
    expect(fieldPointForBillboard(terrain, 16, 24, 40)).toEqual({ x: 24, height: 16, z: 40 });
    expect(fieldPointForBillboard(terrain, 16, 8, 24)).toEqual({ x: 8, height: 0, z: 24 });
  });

  it('builds two textured triangles for each visible ground tile', () => {
    const geometry = buildTerrainGeometry([17, 18], elevation(2, 1, [0, 0]), 16, {
      x: 0,
      y: 0,
      width: 2,
      height: 1,
    });

    expect(geometry.tops).toHaveLength(4);
    expect(geometry.faces).toHaveLength(0);
  });

  it('gives a raised terrace a front and both readable corner faces', () => {
    const geometry = buildTerrainGeometry([17, 17, 17, 17, 17, 17], elevation(3, 2, [0, 4, 0, 0, 0, 0]), 16, {
      x: 0,
      y: 0,
      width: 3,
      height: 2,
    });

    expect(geometry.faces.filter((face) => face.side === 'south')).toHaveLength(8);
    expect(geometry.faces.filter((face) => face.side === 'east')).toHaveLength(8);
    expect(geometry.faces.filter((face) => face.side === 'west')).toHaveLength(8);
    expect(Math.max(...geometry.faces.flatMap((face) => face.vertices.map((vertex) => vertex.height)))).toBe(
      16,
    );
    expect(new Set(geometry.faces.flatMap((face) => face.vertices.map((vertex) => vertex.height)))).toEqual(
      new Set([0, 4, 8, 12, 16]),
    );
    expect(geometry.faces.filter((face) => face.side === 'south').map((face) => face.band)).toEqual([
      'top',
      'top',
      'middle',
      'middle',
      'middle',
      'middle',
      'bottom',
      'bottom',
    ]);
  });

  it('turns consecutive stair heights into separate real risers', () => {
    const geometry = buildTerrainGeometry([93, 93, 93, 93], elevation(1, 4, [4, 3, 2, 1]), 16, {
      x: 0,
      y: 0,
      width: 1,
      height: 4,
    });

    const risers = geometry.faces.filter((face) => face.side === 'south');
    expect(risers).toHaveLength(6);
    expect(risers.map((face) => face.band)).toEqual([
      'single',
      'single',
      'single',
      'single',
      'single',
      'single',
    ]);
    expect(new Set(risers.flatMap((face) => face.vertices.map((vertex) => vertex.height)))).toEqual(
      new Set([4, 8, 12, 16]),
    );
  });
});
