import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCinematicAssetInventory } from '../../scripts/inventory-cinematic-assets';

describe('動画制作素材の目録', () => {
  it('相対パス順で容量と SHA-256 を記録し、ローカル絶対パスを含めない', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'cinematic-assets-'));
    await mkdir(join(rootDir, 'nested'));
    await writeFile(join(rootDir, 'z.png'), Buffer.from('image'));
    await writeFile(join(rootDir, 'nested/a.mp4'), Buffer.from('video'));

    const inventory = await buildCinematicAssetInventory(rootDir);

    expect(inventory.files.map((file) => file.path)).toEqual(['nested/a.mp4', 'z.png']);
    expect(inventory.summary).toMatchObject({
      fileCount: 2,
      totalBytes: 10,
      maxFile: { path: 'nested/a.mp4', bytes: 5 },
    });
    expect(inventory.files[0]).toEqual({
      path: 'nested/a.mp4',
      bytes: 5,
      sha256: createHash('sha256').update('video').digest('hex'),
      mediaType: 'video/mp4',
    });
    expect(JSON.stringify(inventory)).not.toContain(rootDir);
  });

  it('同じ入力から決定的な目録を作る', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'cinematic-assets-'));
    await writeFile(join(rootDir, 'asset.bin'), Buffer.from('same'));
    expect(await buildCinematicAssetInventory(rootDir)).toEqual(await buildCinematicAssetInventory(rootDir));
  });

  it('ルート外を指せるシンボリックリンクを拒否する', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'cinematic-assets-'));
    const outside = join(await mkdtemp(join(tmpdir(), 'outside-assets-')), 'outside.mp4');
    await writeFile(outside, Buffer.from('outside'));
    await symlink(outside, join(rootDir, 'linked.mp4'));

    await expect(buildCinematicAssetInventory(rootDir)).rejects.toThrow(
      'シンボリックリンクは目録化できません',
    );
  });
});
