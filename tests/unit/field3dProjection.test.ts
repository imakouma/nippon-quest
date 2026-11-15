import { describe, expect, it } from 'vitest';
import { createField3dCamera, projectField3dPoint } from '../../src/rendering/overworld/field3dProjection';

describe('field 3D projection', () => {
  const camera = createField3dCamera({ targetX: 0, targetZ: 0, viewportHeight: 180 });

  it('makes an equally wide road segment narrower in the distance', () => {
    const nearLeft = projectField3dPoint({ x: -8, height: 0, z: 80 }, camera);
    const nearRight = projectField3dPoint({ x: 8, height: 0, z: 80 }, camera);
    const farLeft = projectField3dPoint({ x: -8, height: 0, z: -80 }, camera);
    const farRight = projectField3dPoint({ x: 8, height: 0, z: -80 }, camera);

    expect(farRight.x - farLeft.x).toBeLessThan(nearRight.x - nearLeft.x);
  });

  it('projects raised ground above flat ground at the same map position', () => {
    const flat = projectField3dPoint({ x: 0, height: 0, z: 0 }, camera);
    const raised = projectField3dPoint({ x: 0, height: 16, z: 0 }, camera);

    expect(raised.y).toBeLessThan(flat.y);
    expect(raised.depth).toBeGreaterThan(0);
  });

  it('keeps north-to-south ground rows in screen order', () => {
    const rows = [-96, -48, 0, 48, 96].map((z) => projectField3dPoint({ x: 0, height: 0, z }, camera));

    expect(rows.map((point) => point.y)).toEqual([...rows].map((point) => point.y).sort((a, b) => a - b));
  });
});
