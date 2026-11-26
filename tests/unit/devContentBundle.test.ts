import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { readDevContentBundle } from '../../scripts/dev-content-bundle';

it('開発用 bundle は現在の JSON を読み直し、content 外を読まない', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nq-dev-bundle-'));
  try {
    await mkdir(join(root, 'monsters'));
    await writeFile(
      join(root, 'manifest.json'),
      JSON.stringify({ files: { monsters: ['monsters/a.json'] } }),
    );
    await writeFile(join(root, 'monsters/a.json'), '{"name":"before"}');
    expect((await readDevContentBundle(root))['monsters/a.json']).toEqual({ name: 'before' });
    await writeFile(join(root, 'monsters/a.json'), '{"name":"after"}');
    expect((await readDevContentBundle(root))['monsters/a.json']).toEqual({ name: 'after' });
    await writeFile(
      join(root, 'manifest.json'),
      JSON.stringify({ files: { monsters: ['../outside.json'] } }),
    );
    await expect(readDevContentBundle(root)).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
