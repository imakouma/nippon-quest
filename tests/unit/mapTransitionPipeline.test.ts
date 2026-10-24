import { describe, expect, it, vi } from 'vitest';
import type { MapTransitionRequest } from '../../src/scenes/overworld/mapTransitionPipeline';
import { resolveMapEntry, type MapEntryMap } from '../../src/scenes/overworld/mapEntry';

const request = (overrides: Partial<MapTransitionRequest> = {}): MapTransitionRequest => ({
  targetMap: 'test-map',
  reason: 'door',
  ...overrides,
});

const map = (overrides: Partial<MapEntryMap> = {}): MapEntryMap => ({
  key: 'test-map',
  width: 4,
  height: 3,
  objects: [
    { name: 'spawn', type: 'spawn', x: 0, y: 0 },
    { name: 'from-door', type: 'spawn', x: 32, y: 16 },
  ],
  isWalkable: () => true,
  ...overrides,
});

describe('resolveMapEntry', () => {
  it('uses a walkable exact tile before every other candidate', () => {
    expect(
      resolveMapEntry({
        request: request({ tile: [3, 2], exactSpawn: true, spawnName: 'from-door' }),
        map: map(),
        saved: { mapKey: 'test-map', x: 1, y: 2, facing: 'left' },
      }),
    ).toEqual({ x: 3, y: 2, facing: 'down', source: 'exact-tile' });
  });

  it('places a map warp beside its tile in the existing down, left, right, up order', () => {
    const blocked = new Set(['1,2']);
    expect(
      resolveMapEntry({
        request: request({ tile: [1, 1] }),
        map: map({ isWalkable: (x, y) => !blocked.has(`${x},${y}`) }),
      }),
    ).toEqual({ x: 0, y: 1, facing: 'down', source: 'map-tile' });
  });

  it('falls through invalid exact tiles to a named spawn', () => {
    expect(
      resolveMapEntry({
        request: request({ tile: [9, 9], exactSpawn: true, spawnName: 'from-door' }),
        map: map(),
      }),
    ).toEqual({ x: 2, y: 1, facing: 'down', source: 'named-spawn' });
  });

  it('uses a saved position only for the same map and preserves its facing', () => {
    expect(
      resolveMapEntry({
        request: request(),
        map: map(),
        saved: { mapKey: 'test-map', x: 3, y: 1, facing: 'up' },
      }),
    ).toEqual({ x: 3, y: 1, facing: 'up', source: 'saved-position' });
  });

  it('uses the default spawn when no explicit or saved entry is valid', () => {
    expect(
      resolveMapEntry({
        request: request({ spawnName: 'missing' }),
        map: map(),
        saved: { mapKey: 'another-map', x: 3, y: 1, facing: 'up' },
      }),
    ).toEqual({ x: 0, y: 0, facing: 'down', source: 'default-spawn' });
  });

  it('uses the first walkable tile as a deterministic final fallback', () => {
    const isWalkable = vi.fn((x: number, y: number) => x === 2 && y === 1);
    const entry = resolveMapEntry({
      request: request({ spawnName: 'missing' }),
      map: map({ objects: [], isWalkable }),
    });

    expect(entry).toEqual({ x: 2, y: 1, facing: 'down', source: 'fallback' });
    expect(isWalkable.mock.calls.at(-1)).toEqual([2, 1]);
  });

  it('rejects a map with no collision-safe entry', () => {
    expect(() =>
      resolveMapEntry({
        request: request(),
        map: map({ objects: [], isWalkable: () => false }),
      }),
    ).toThrow('test-map has no walkable entry');
  });
});
