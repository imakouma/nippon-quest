import { describe, expect, it } from 'vitest';
import { VIEW } from '../../src/scenes/overworld/overworldView';
import { waterTileForFrame } from '../../src/scenes/overworld/waterAnimation';

describe('海のアニメーション', () => {
  it('通常の波線が3フレームすべてを通って一周する', () => {
    const frames = Array.from({ length: 3 }, (_, frame) => waterTileForFrame(12, 7, frame));
    expect(new Set(frames)).toEqual(new Set([VIEW.WATER, VIEW.WATER_FLOW_1, VIEW.WATER_FLOW_2]));
    expect(waterTileForFrame(12, 7, 0)).toBe(waterTileForFrame(12, 7, 3));
  });

  it('となり合う海面のフレームをずらす', () => {
    const row = Array.from({ length: 3 }, (_, x) => waterTileForFrame(x, 4, 0));
    expect(new Set(row)).toEqual(new Set([VIEW.WATER, VIEW.WATER_FLOW_1, VIEW.WATER_FLOW_2]));
  });
});
