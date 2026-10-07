import { describe, expect, it } from 'vitest';
import { JAPAN_REGION_LAYOUT, nationalRegionAt } from '../../src/ui/field/JapanMapOverview';
import type { MapRegionInfo } from '../../src/ui/field/worldMapModel';

const regions = Object.keys(JAPAN_REGION_LAYOUT).map((id) => ({ id })) as MapRegionInfo[];

describe('全国地図', () => {
  it('10地方すべてに重ならない選択位置がある', () => {
    expect(Object.keys(JAPAN_REGION_LAYOUT)).toHaveLength(10);
    regions.forEach((region, index) => {
      const box = JAPAN_REGION_LAYOUT[region.id]!;
      expect(nationalRegionAt(regions, box.x + box.w / 2, box.y + box.h / 2)).toBe(index);
    });
  });
});
