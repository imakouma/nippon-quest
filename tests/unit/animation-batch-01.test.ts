import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import assignments from '../../tasks/animation-batch-assignments.json';
import evolutionReferences from '../../assets/sprites/animations/batch-01/evolution-references.json';
import manifest from '../../assets/sprites/animations/batch-01/manifest.json';
import {
  characterAnimationReference,
  fixedCharacterAnimationSpec,
} from '../../src/rendering/characterAnimation';
import { monsterAnimationSpec } from '../../src/rendering/monsterAnimation';

const batch = assignments.batches.find((entry) => entry.batch === 'batch-01')!;

describe('animation batch-01', () => {
  it('registers only produced runtime monsters owned by batch-01', () => {
    expect(manifest.map((entry) => entry.id)).toEqual([
      'aomori-bunakko',
      'aomori-doguukun',
      'aomori-nebutan',
      'iwate-kagurabi',
      'iwate-izumiko',
      'iwate-kodamaru',
    ]);
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
      expect(png.readUInt8(25) & 4).toBe(4);
    }
  });

  it('exposes named-character sheets without replacing the customizable hero', () => {
    expect(characterAnimationReference('protagonist')?.integration).toBe('customizable-reference');
    expect(characterAnimationReference('michiru')?.integration).toBe('fixed-character');
    expect(characterAnimationReference('shiori')?.integration).toBe('fixed-character');
    expect(fixedCharacterAnimationSpec('protagonist')).toBeUndefined();
    expect(fixedCharacterAnimationSpec('michiru')?.path).toBe('sprites/animations/batch-01/michiru-v1.png');
    expect(fixedCharacterAnimationSpec('shiori')?.path).toBe('sprites/animations/batch-01/shiori-v1.png');
    for (const id of ['protagonist', 'michiru', 'shiori']) {
      const spec = characterAnimationReference(id)!;
      expect(batch.ids).toContain(spec.id);
      const png = readFileSync(`assets/${spec.path}`);
      expect(png.readUInt32BE(16)).toBe(512);
      expect(png.readUInt32BE(20)).toBe(256);
      expect(png.readUInt8(25) & 4).toBe(4);
    }
  });

  it('keeps evolution sheets visual-only and out of the runtime monster manifest', () => {
    const runtimeIds = new Set(manifest.map((entry) => entry.id));
    expect(evolutionReferences).toHaveLength(6);

    for (const entry of evolutionReferences) {
      expect(batch.ids).toContain(entry.id);
      expect(entry.id).toMatch(/-stage-[23]$/);
      expect(entry.integration).toBe('visual-only');
      expect(runtimeIds.has(entry.id)).toBe(false);

      const png = readFileSync(`assets/${entry.path}`);
      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(png.readUInt32BE(16)).toBe(512);
      expect(png.readUInt32BE(20)).toBe(256);
      expect(png.readUInt8(25) & 4).toBe(4);
    }
  });
});
