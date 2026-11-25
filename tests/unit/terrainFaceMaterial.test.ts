import { describe, expect, it } from 'vitest';
import { NQ, NQ48 } from '../../src/rendering/palette';
import { cliffFacePixels } from '../../src/rendering/overworld/terrainFaceMaterial';

describe('terrain cliff face material', () => {
  it('keeps the grass lip on the exposed top edge only', () => {
    const top = cliffFacePixels('south', 'top');
    const single = cliffFacePixels('south', 'single');
    const middle = cliffFacePixels('south', 'middle');

    expect(top.slice(0, 16)).toContain(NQ.leaf);
    expect(top.slice(0, 16)).toContain(NQ.green);
    expect(single.slice(0, 16)).toContain(NQ.leaf);
    expect(single.slice(48, 64)).toContain(NQ.bark);
    expect(middle).not.toContain(NQ.leaf);
    expect(middle).not.toContain(NQ.green);
  });

  it('adds a dark contact shadow only at the bottom edge', () => {
    const middle = cliffFacePixels('south', 'middle');
    const bottom = cliffFacePixels('south', 'bottom');

    expect(middle.slice(48, 64)).not.toContain(NQ.bark);
    expect(bottom.slice(48, 64)).toContain(NQ.bark);
  });

  it('uses darker earth and stone colors on the side faces', () => {
    const south = new Set(cliffFacePixels('south', 'middle'));
    const east = new Set(cliffFacePixels('east', 'middle'));
    const west = new Set(cliffFacePixels('west', 'middle'));

    expect(south).toContain(NQ.tan);
    expect(east).toContain(NQ.brown);
    expect(west).toContain(NQ.bark);
    expect(south).not.toEqual(east);
    expect(east).not.toEqual(west);
  });

  it('stays inside the shared NQ-48 palette', () => {
    for (const side of ['south', 'east', 'west'] as const)
      for (const band of ['single', 'top', 'middle', 'bottom'] as const)
        expect(cliffFacePixels(side, band).every((color) => NQ48.includes(color))).toBe(true);
  });
});
