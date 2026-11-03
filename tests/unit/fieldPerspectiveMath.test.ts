import { describe, expect, it } from 'vitest';
import {
  perspectiveScale,
  projectPerspectivePoint,
  projectPerspectiveY,
  unprojectPerspectiveY,
} from '../../src/scenes/overworld/fieldPerspectiveMath';

describe('field perspective projection', () => {
  it('keeps the horizon stable and widens the foreground by eight percent', () => {
    expect(perspectiveScale(0)).toBe(1);
    expect(perspectiveScale(0.5)).toBe(1.04);
    expect(perspectiveScale(1)).toBe(1.08);
  });

  it('compresses distant rows and expands foreground rows without moving the edges', () => {
    expect(projectPerspectiveY(0)).toBe(0);
    expect(projectPerspectiveY(1)).toBe(1);
    expect(projectPerspectiveY(0.25)).toBeLessThan(0.25);
    expect(projectPerspectiveY(1) - projectPerspectiveY(0.75)).toBeGreaterThan(projectPerspectiveY(0.25));
  });

  it('keeps the center line fixed and converges horizontal edges toward the distance', () => {
    expect(projectPerspectivePoint({ x: 0.5, y: 0.75 }).x).toBe(0.5);
    expect(projectPerspectivePoint({ x: 0.25, y: 0 }).x).toBe(0.25);
    expect(projectPerspectivePoint({ x: 0.25, y: 1 }).x).toBeCloseTo(0.23);
  });

  it('round-trips the vertical projection used by the shader', () => {
    for (const y of [0, 0.1, 0.5, 0.9, 1]) {
      expect(unprojectPerspectiveY(projectPerspectiveY(y))).toBeCloseTo(y, 6);
    }
  });
});
