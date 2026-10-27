import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import assignments from '../../tasks/animation-batch-assignments.json';
import type { MonsterAnimationSpec } from '../../src/rendering/monsterAnimation';

const firstSliceIds = ['aichi-denkou-giku', 'aichi-midboss-tokoname-neko', 'akita-akitainu'] as const;

describe('animation batch-05', () => {
  it('keeps the batch assignment fixed at 110 unique ids', () => {
    const batch = assignments.batches.find((entry) => entry.batch === 'batch-05');

    expect(batch?.ids).toHaveLength(110);
    expect(new Set(batch?.ids).size).toBe(110);
    expect(batch?.ids.slice(0, firstSliceIds.length)).toEqual(firstSliceIds);
  });

  it('registers the verified first slice with the shared animation contract', () => {
    const manifest = JSON.parse(
      readFileSync('assets/sprites/animations/batch-05/manifest.json', 'utf8'),
    ) as MonsterAnimationSpec[];

    expect(manifest.map(({ id }) => id)).toEqual(firstSliceIds);
    for (const spec of manifest) {
      expect(spec).toEqual({
        id: spec.id,
        key: `mon.animation.${spec.id}.v1`,
        path: `sprites/animations/batch-05/${spec.id}-v1.png`,
        frameWidth: 128,
        frameHeight: 128,
        idle: [0, 1, 0, 3, 0, 2, 0],
        attack: [4, 5, 6, 7, 0],
      });
    }
  });
});
