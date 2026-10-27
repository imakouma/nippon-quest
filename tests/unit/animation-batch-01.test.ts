import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import assignments from '../../tasks/animation-batch-assignments.json';
import manifest from '../../assets/sprites/animations/batch-01/manifest.json';
import { monsterAnimationSpec } from '../../src/rendering/monsterAnimation';

const batch = assignments.batches.find((entry) => entry.batch === 'batch-01')!;

describe('animation batch-01', () => {
  it('registers only produced runtime monsters owned by batch-01', () => {
    expect(manifest.map((entry) => entry.id)).toEqual(['iwate-kagurabi', 'iwate-izumiko', 'iwate-kodamaru']);
    for (const entry of manifest) {
      expect(batch.ids).toContain(entry.id);
      expect(entry.id).not.toMatch(/-stage-[23]$/);
      expect(monsterAnimationSpec(entry.id)).toEqual(entry);
    }
  });

  it('keeps every production sheet transparent RGBA at the shared 4x2 size', () => {
    for (const entry of manifest) {
      const png = readFileSync(`assets/${entry.path}`);
      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(png.readUInt32BE(16)).toBe(512);
      expect(png.readUInt32BE(20)).toBe(256);
      expect(png[25] & 4).toBe(4);
    }
  });
});
