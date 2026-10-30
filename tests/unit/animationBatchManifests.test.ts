import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import assignments from '../../tasks/animation-batch-assignments.json';
import { monsterAnimationSpec, type MonsterAnimationSpec } from '../../src/rendering/monsterAnimation';

describe('並列制作の担当とmanifest', () => {
  it('551対象を5担当へ重複なく割り振る', () => {
    const ids = assignments.batches.flatMap((batch) => batch.ids);
    expect(assignments.batches).toHaveLength(5);
    expect(ids).toHaveLength(551);
    expect(new Set(ids).size).toBe(551);
    expect(assignments.batches[0]!.ids).toContain('protagonist');
    expect(assignments.batches[0]!.ids).toContain('aomori-ringoron');
  });

  it('登録済み素材だけを有効にし、担当外・欠損・不正サイズを防ぐ', () => {
    const seen = new Set<string>();
    for (const batch of assignments.batches) {
      const path = `assets/sprites/animations/${batch.batch}/manifest.json`;
      const entries = JSON.parse(readFileSync(path, 'utf8')) as MonsterAnimationSpec[];
      for (const spec of entries) {
        expect(batch.ids).toContain(spec.id);
        expect(seen.has(spec.id)).toBe(false);
        seen.add(spec.id);
        expect(spec.id).not.toMatch(/-stage-[23]$/);
        expect(spec.id).not.toBe('aomori-ringoron');
        expect(spec.key).toBe(`mon.animation.${spec.id}.v1`);
        expect(spec.path).toBe(`sprites/animations/${batch.batch}/${spec.id}-v1.png`);
        expect(spec.frameWidth).toBe(128);
        expect(spec.frameHeight).toBe(128);
        expect(spec.idle).toEqual([0, 1, 0, 3, 0, 2, 0]);
        expect(spec.attack).toEqual([4, 5, 6, 7, 0]);
        expect(existsSync(`assets/${spec.path}`)).toBe(true);
        const png = readFileSync(`assets/${spec.path}`);
        expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        expect(png.readUInt32BE(16)).toBe(512);
        expect(png.readUInt32BE(20)).toBe(256);
        expect(monsterAnimationSpec(spec.id)).toEqual(spec);
      }
    }
  });

  it('本番へ542キャラクターを重複なく登録し、未制作を残さない', () => {
    const existingManifestIds = assignments.batches.flatMap((batch) => {
      const path = `assets/sprites/animations/${batch.batch}/manifest.json`;
      const entries = JSON.parse(readFileSync(path, 'utf8')) as MonsterAnimationSpec[];
      return entries.map((entry) => entry.id);
    });
    const batch06 = JSON.parse(
      readFileSync('assets/sprites/animations/batch-06/manifest.json', 'utf8'),
    ) as MonsterAnimationSpec[];
    const manifestIds = [...existingManifestIds, ...batch06.map((entry) => entry.id)];

    expect(existingManifestIds).toHaveLength(488);
    expect(batch06).toHaveLength(53);
    expect(manifestIds).toHaveLength(541);
    expect(new Set(manifestIds).size).toBe(541);
    expect(monsterAnimationSpec('aomori-ringoron')).toBeDefined();
    expect(manifestIds.length + 1).toBe(assignments.runtimeMonsters);
  });
});
