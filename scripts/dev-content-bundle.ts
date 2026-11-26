import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

/** 開発中の編集を反映し、manifest にあるデータを一つの応答にまとめる。 */
export async function readDevContentBundle(root: string): Promise<Record<string, unknown>> {
  const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8')) as {
    files: Record<string, string[]>;
  };
  const files = [...new Set(Object.values(manifest.files).flat())];
  const entries = await Promise.all(
    files.map(async (file): Promise<[string, unknown]> => {
      const path = resolve(root, file);
      const inside = relative(root, path);
      if (isAbsolute(inside) || inside === '..' || inside.startsWith(`..${sep}`))
        throw new Error('Invalid content path');
      return [file, JSON.parse(await readFile(path, 'utf8'))];
    }),
  );
  return Object.fromEntries([['manifest.json', manifest], ...entries]);
}
