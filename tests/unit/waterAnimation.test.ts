import { describe, expect, it } from 'vitest';
import { VIEW } from '../../src/scenes/overworld/overworldView';
import { waterTileForFrame } from '../../src/scenes/overworld/waterAnimation';

describe('海のアニメーション', () => {
  it('同じ海面のきらめきが9フレームで一周する', () => {
    const frames = Array.from({ length: 9 }, (_, frame) => waterTileForFrame(12, 7, frame));
    expect(frames.filter((tile) => tile === VIEW.WATER_GLINT)).toHaveLength(1);
    expect(frames.filter((tile) => tile === VIEW.WATER)).toHaveLength(8);
    expect(waterTileForFrame(12, 7, 0)).toBe(waterTileForFrame(12, 7, 9));
  });

  it('となり合う海面が同時に全部光らない', () => {
    const row = Array.from({ length: 9 }, (_, x) => waterTileForFrame(x, 4, 3));
    expect(new Set(row)).toEqual(new Set([VIEW.WATER, VIEW.WATER_GLINT]));
  });
});
