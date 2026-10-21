import { describe, expect, it } from 'vitest';
import { ROAD_TILE } from '../../src/core/world/ground';
import { NQ } from '../../src/rendering/palette';
import { areaMapTerrainColor } from '../../src/ui/field/areaMapTerrain';

describe('エリア地図の地形色', () => {
  it('土の道はフィールド本編と同じ砂色で表示する', () => {
    expect(areaMapTerrainColor(ROAD_TILE)).toBe(NQ.sand);
  });
});
