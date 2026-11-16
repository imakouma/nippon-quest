import { describe, expect, it } from 'vitest';
import type { TerrainElevation } from '../../src/core/world/terrainElevation';
import { buildElevationView } from '../../src/rendering/overworld/elevationView';

describe('elevation view', () => {
  it('puts every terrain tile in exactly one projected height band', () => {
    const elevation: TerrainElevation = { width: 2, height: 2, tiles: [4, 4, 0, 3] };
    const view = buildElevationView([10, 20, 30, 306], elevation, 16);

    expect(view.bands).toEqual([
      { elevation: 0, offsetY: 0, tiles: [-1, -1, 30, -1] },
      { elevation: 3, offsetY: -12, tiles: [-1, -1, -1, 306] },
      { elevation: 4, offsetY: -16, tiles: [10, 20, -1, -1] },
    ]);
    expect(view.bands.flatMap((band) => band.tiles).filter((tile) => tile >= 0)).toHaveLength(4);
  });

  it('fills south-facing gaps with a cliff face or stair riser', () => {
    const elevation: TerrainElevation = { width: 2, height: 2, tiles: [4, 4, 0, 3] };
    const view = buildElevationView([10, 20, 30, 306], elevation, 16);

    expect(view.faces).toEqual([
      { x: 0, y: 0, height: 16, style: 'cliff' },
      { x: 16, y: 0, height: 4, style: 'stairs' },
    ]);
  });

  it('keeps a flat map in one unshifted band with no faces', () => {
    const elevation: TerrainElevation = { width: 2, height: 1, tiles: [0, 0] };
    expect(buildElevationView([1, 2], elevation, 16)).toEqual({
      bands: [{ elevation: 0, offsetY: 0, tiles: [1, 2] }],
      faces: [],
    });
  });
});
