import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { loadContent } from '../../src/core/content/loader';

it('loads all game content from the boot bundle without duplicating separately loaded JSON', async () => {
  const bundle = JSON.parse(readFileSync('content/content-bundle.json', 'utf8'));
  const required = ['manifest.json', ...Object.values(bundle['manifest.json'].files).flat()];
  expect(Object.keys(bundle).sort()).toEqual([...new Set(required)].sort());
  const content = await loadContent(async (path) => {
    expect(Object.hasOwn(bundle, path)).toBe(true);
    return bundle[path];
  });
  expect(content.areas.size).toBeGreaterThan(0);
  expect(content.questionFiles.length).toBeGreaterThan(0);
  for (const path of required as string[]) {
    expect(bundle[path]).toEqual(JSON.parse(readFileSync(`content/${path}`, 'utf8')));
  }
});
