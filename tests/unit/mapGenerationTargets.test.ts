import type * as NodeFs from 'node:fs';
import { basename } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mapGenerationOptions } from '../../scripts/maps/generationOptions';

const writes = vi.hoisted(() => vi.fn());
vi.mock('node:fs', async (original) => ({
  ...(await original<typeof NodeFs>()),
  writeFileSync: writes,
  mkdirSync: vi.fn(),
}));
vi.mock('prettier', () => ({
  resolveConfig: async () => ({}),
  format: async (text: string) => text,
}));
vi.mock('../../scripts/maps/syncInterPrefectureMap.js', () => ({
  syncInterPrefectureMapFile: () => ({ layers: [] }),
}));

const argv = process.argv;
async function generate(...args: string[]) {
  process.argv = ['node', 'scaffold-maps.ts', ...args];
  await import('../../scripts/scaffold-maps');
  return writes.mock.calls.map(([path]) => basename(String(path)));
}

beforeEach(() => {
  vi.resetModules();
  writes.mockClear();
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  process.argv = argv;
  vi.restoreAllMocks();
});

describe('map generation write targets', () => {
  it('writes only the selected town, never fields or the world map', async () => {
    expect(await generate('--towns-only', '--only=aomori')).toEqual(['aomori-town.json']);
  });

  it('preserves all-town regeneration without --only', async () => {
    const files = await generate('--towns-only');
    expect(files).toHaveLength(47);
    expect(files.every((file) => file.endsWith('-town.json'))).toBe(true);
  });

  it('generates city roads without using field terrain ids', async () => {
    expect(await generate('--towns-only', '--only=tokyo')).toEqual(['tokyo-town.json']);
    const map = JSON.parse(String(writes.mock.calls[0]![1])) as {
      layers: { name: string; data?: number[] }[];
    };
    const ids = map.layers.find((layer) => layer.name === 'background')!.data!;
    expect(ids).toEqual(expect.arrayContaining([302, 303, 304]));
    expect(ids.filter((id) => [161, 162, 163].includes(id))).toEqual([]);
  });

  it('preserves selected field regeneration options', () => {
    expect(mapGenerationOptions(['--force', '--only=aomori'])).toEqual({
      force: true,
      only: 'aomori',
      townsOnly: false,
      linksOnly: false,
      worldMapOnly: false,
    });
  });

  it('preserves selected link synchronization', async () => {
    expect(await generate('--links-only', '--only=aomori')).toEqual(['aomori-field.json']);
  });

  it('preserves world-map-only regeneration options', () => {
    expect(mapGenerationOptions(['--force', '--worldmap-only'])).toEqual({
      force: true,
      only: undefined,
      townsOnly: false,
      linksOnly: false,
      worldMapOnly: true,
    });
  });

  it.each([
    ['--towns-only', '--only=unknown'],
    ['--towns-only', '--only='],
    ['--towns-only', '--only'],
    ['--towns-only', '--only=aomori', '--only=tokyo'],
    ['--towns-only', '--worldmap-only'],
    ['--towns-only', '--links-only'],
    ['--links-only', '--worldmap-only'],
    ['--worldmap-only', '--only=aomori'],
  ])('rejects invalid targeting before any write: %j', async (...args) => {
    await expect(generate(...args)).rejects.toThrow();
    expect(writes).not.toHaveBeenCalled();
  });
});
