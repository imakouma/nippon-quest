import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CITY_LOOKS } from '../../scripts/data/towns';
import { drawTownTiles } from '../../src/rendering/overworld/townTiles';
import { CITY_ROAD_TILES } from '../../src/shared/cityRoadTiles';

describe('town atlas ownership', () => {
  it.each(Object.keys(CITY_LOOKS))('%s uses reserved city road gids', (prefecture) => {
    const map = JSON.parse(
      readFileSync(new URL(`../../maps/${prefecture}-town.json`, import.meta.url), 'utf8'),
    ) as {
      layers: { name: string; data?: number[] }[];
    };
    const ids = map.layers.find((layer) => layer.name === 'background')!.data!;
    expect(ids).toEqual(expect.arrayContaining(Object.values(CITY_ROAD_TILES)));
    expect(ids.filter((id) => [161, 162, 163].includes(id))).toEqual([]);
  });

  it('does not overwrite field ash, steam, or dirt-road tiles', () => {
    const ids: number[] = [];
    drawTownTiles({
      tile: (id) => ids.push(id),
      block: (first, w, h) => {
        for (let i = 0; i < w * h; i++) ids.push(first + i);
      },
    });
    expect(ids.filter((id) => [161, 162, 163].includes(id))).toEqual([]);
    expect(ids).toEqual(expect.arrayContaining([302, 303, 304]));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id > 0 && id <= 320)).toBe(true);
  });

  it('keeps city road markings inside their atlas cells', () => {
    const roads: readonly number[] = Object.values(CITY_ROAD_TILES);
    drawTownTiles({
      tile: (id, draw) => {
        if (!roads.includes(id)) return;
        draw((x, y, w, h) => {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(x + w).toBeLessThanOrEqual(16);
          expect(y + h).toBeLessThanOrEqual(16);
        });
      },
      block: () => undefined,
    });
  });
});
