import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JAPAN_GENERAL_REGIONS, nationalRegionAt } from '../../src/ui/field/JapanMapOverview';
import { buildNationalMapHighlight, buildNationalMapRaster } from '../../src/ui/field/nationalMapGeometry';
import type { WorldMapData } from '../../src/ui/field/worldMapModel';

const worldMap = JSON.parse(
  readFileSync(new URL('../../public/worldmap.json', import.meta.url), 'utf8'),
) as WorldMapData;

describe('全国地図', () => {
  it('一般的な8地方で全都道府県グループを選べる', () => {
    expect(JAPAN_GENERAL_REGIONS).toHaveLength(8);
    expect(JAPAN_GENERAL_REGIONS.find((region) => region.id === 'chubu')?.sourceIds).toEqual([
      'hokuriku',
      'koshinetsu',
      'tokai',
    ]);
    const raster = buildNationalMapRaster(worldMap.regions);
    JAPAN_GENERAL_REGIONS.forEach((region, index) => {
      const sourceIndexes = region.sourceIds.map((sourceId) =>
        worldMap.regions.findIndex((source) => source.id === sourceId),
      );
      const point = raster.regionAt.findIndex((sourceIndex) => sourceIndexes.includes(sourceIndex));
      expect(point).toBeGreaterThanOrEqual(0);
      expect(nationalRegionAt(raster, point % raster.width, Math.floor(point / raster.width))).toBe(index);
    });
  });

  it('海を地方として誤選択せず、実際の陸地だけを選べる', () => {
    const raster = buildNationalMapRaster(worldMap.regions);
    expect(nationalRegionAt(raster, 0, 0)).toBe(-1);
  });

  it('東北6県の外周だけを一続きに光らせ、四角い選択枠を作らない', () => {
    const raster = buildNationalMapRaster(worldMap.regions);
    const highlight = buildNationalMapHighlight(raster, ['tohoku']);
    const selected = [...highlight.selected].filter(Boolean).length;
    const outline = [...highlight.outline].filter(Boolean).length;
    const glow = [...highlight.glowDistance].filter(Boolean).length;

    expect(selected).toBeGreaterThan(100);
    expect(outline).toBeGreaterThan(20);
    expect(glow).toBeGreaterThan(outline);

    highlight.outline.forEach((isOutline, index) => {
      if (!isOutline) return;
      const x = index % raster.width;
      const y = Math.floor(index / raster.width);
      const neighbours = [index - 1, index + 1, index - raster.width, index + raster.width].filter(
        (_, direction) =>
          (direction !== 0 || x > 0) &&
          (direction !== 1 || x < raster.width - 1) &&
          (direction !== 2 || y > 0) &&
          (direction !== 3 || y < raster.height - 1),
      );
      expect(neighbours.some((neighbour) => highlight.selected[neighbour])).toBe(true);
    });

    const selectedPoints = [...highlight.selected]
      .map((value, index) => (value ? [index % raster.width, Math.floor(index / raster.width)] : null))
      .filter((point): point is number[] => Boolean(point));
    const left = Math.min(...selectedPoints.map(([x]) => x!));
    const top = Math.min(...selectedPoints.map(([, y]) => y!));
    expect(highlight.outline[top * raster.width + left]).toBe(0);
  });
});
