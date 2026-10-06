import { describe, expect, it } from 'vitest';
import { LOCKED_REGION_TILE, regionMapTile } from '../../src/shared/regionVisibility';

describe('未開放エリアの地図表示', () => {
  it('未開放の陸を海に変えず、影のタイルとして残す', () => {
    expect(regionMapTile(4, true)).toBe(LOCKED_REGION_TILE);
    expect(regionMapTile(4, true)).not.toBe(3);
  });

  it('開放済みの地形と本物の海はそのままにする', () => {
    expect(regionMapTile(4, false)).toBe(4);
    expect(regionMapTile(3, false)).toBe(3);
  });
});
