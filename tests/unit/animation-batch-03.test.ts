import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import assignments from '../../tasks/animation-batch-assignments.json';
import manifest from '../../assets/sprites/animations/batch-03/manifest.json';
import { monsterAnimationSpec, type MonsterAnimationSpec } from '../../src/rendering/monsterAnimation';

const firstSliceIds = ['aichi-boss-kinshachi-ou', 'aichi-kokekokkochin', 'aichi-shiborin'] as const;

describe('animation batch-03', () => {
  it('先頭3体の制作済みシートをmanifestへ登録する', () => {
    const batch = assignments.batches.find((candidate) => candidate.batch === 'batch-03');
    expect(batch?.ids).toHaveLength(110);

    const specs = manifest as MonsterAnimationSpec[];
    expect(specs.map((spec) => spec.id)).toEqual(expect.arrayContaining([...firstSliceIds]));

    for (const id of firstSliceIds) {
      const spec = specs.find((candidate) => candidate.id === id);
      expect(spec).toEqual({
        id,
        key: `mon.animation.${id}.v1`,
        path: `sprites/animations/batch-03/${id}-v1.png`,
        frameWidth: 128,
        frameHeight: 128,
        idle: [0, 1, 0, 3, 0, 2, 0],
        attack: [4, 5, 6, 7, 0],
      });
      expect(monsterAnimationSpec(id)).toEqual(spec);

      const path = `assets/${spec!.path}`;
      expect(existsSync(path)).toBe(true);
      const png = readFileSync(path);
      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(png.readUInt32BE(16)).toBe(512);
      expect(png.readUInt32BE(20)).toBe(256);
    }
  });
});
