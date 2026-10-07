import { describe, expect, it } from 'vitest';
import {
  JAPAN_GENERAL_REGIONS,
  JAPAN_REGION_LAYOUT,
  nationalRegionAt,
} from '../../src/ui/field/JapanMapOverview';

describe('全国地図', () => {
  it('一般的な8地方で全都道府県グループを選べる', () => {
    expect(JAPAN_GENERAL_REGIONS).toHaveLength(8);
    expect(JAPAN_GENERAL_REGIONS.find((region) => region.id === 'chubu')?.sourceIds).toEqual([
      'hokuriku',
      'koshinetsu',
      'tokai',
    ]);
    JAPAN_GENERAL_REGIONS.forEach((region, index) => {
      region.sourceIds.forEach((sourceId) => {
        const box = JAPAN_REGION_LAYOUT[sourceId]!;
        expect(nationalRegionAt(box.x + box.w / 2, box.y + box.h / 2)).toBe(index);
      });
    });
  });
});
