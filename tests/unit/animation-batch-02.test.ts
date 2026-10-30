import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import assignments from '../../tasks/animation-batch-assignments.json';
import type { MonsterAnimationSpec } from '../../src/rendering/monsterAnimation';

describe('animation batch-02', () => {
  it('registers every assigned monster with the shared animation contract', () => {
    const batch = assignments.batches.find((entry) => entry.batch === 'batch-02');
    const manifest = JSON.parse(
      readFileSync('assets/sprites/animations/batch-02/manifest.json', 'utf8'),
    ) as MonsterAnimationSpec[];

    expect(batch).toBeDefined();
    expect(manifest.map((entry) => entry.id)).toEqual(batch!.ids);

    for (const spec of manifest) {
      expect(batch!.ids).toContain(spec.id);
      expect(spec).toEqual({
        id: spec.id,
        key: `mon.animation.${spec.id}.v1`,
        path: `sprites/animations/batch-02/${spec.id}-v1.png`,
        frameWidth: 128,
        frameHeight: 128,
        idle: [0, 1, 0, 3, 0, 2, 0],
        attack: [4, 5, 6, 7, 0],
      });
      expect(existsSync(`assets/${spec.path}`)).toBe(true);

      const png = readFileSync(`assets/${spec.path}`);
      expect(png.readUInt32BE(16)).toBe(512);
      expect(png.readUInt32BE(20)).toBe(256);
    }
  });
});
