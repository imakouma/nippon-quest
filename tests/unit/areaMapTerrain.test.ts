import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ROAD_TILE } from '../../src/core/world/ground';
import { NQ } from '../../src/rendering/palette';
import { areaMapTerrainColor, terrainDetailScale } from '../../src/ui/field/areaMapTerrain';

const MAPS = fileURLToPath(new URL('../../maps/', import.meta.url));

describe('エリア地図の地形色', () => {
  it('拡大するほど地形の描画密度を上げる', () => {
    expect(terrainDetailScale(1)).toBe(1);
    expect(terrainDetailScale(1.49)).toBe(1);
    expect(terrainDetailScale(1.5)).toBe(4);
    expect(terrainDetailScale(1.99)).toBe(4);
    expect(terrainDetailScale(2)).toBe(8);
    expect(terrainDetailScale(3)).toBe(8);
  });

  it('土の道はフィールド本編と同じ砂色で表示する', () => {
    expect(areaMapTerrainColor(ROAD_TILE)).toBe(NQ.sand);
  });

  it('47都道府県すべてのフィールドに砂色で表示される土の道がある', () => {
    const fields = readdirSync(MAPS).filter((name) => name.endsWith('-field.json'));
    expect(fields).toHaveLength(47);

    for (const name of fields) {
      const map = JSON.parse(readFileSync(`${MAPS}${name}`, 'utf8')) as {
        layers: { name: string; data?: number[] }[];
      };
      const tiles = map.layers.find((layer) => layer.name === 'background')?.data ?? [];
      expect(tiles, name).toContain(ROAD_TILE);
      expect(areaMapTerrainColor(ROAD_TILE), name).toBe(NQ.sand);
    }
  });
});
