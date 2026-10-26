import { describe, expect, it } from 'vitest';
import type { FieldResumeSnapshot } from '../../src/core/state/schema';
import {
  captureFieldResume,
  resolveFieldResume,
  selectResumeMap,
  type FieldObjectState,
} from '../../src/scenes/overworld/fieldResumeSnapshot';
import type { MapEntryMap } from '../../src/scenes/overworld/mapEntry';

const map = (blocked = new Set<string>()): MapEntryMap => ({
  key: 'test-map',
  width: 4,
  height: 3,
  objects: [{ name: 'spawn', type: 'spawn', x: 0, y: 0 }],
  isWalkable: (x, y) => !blocked.has(`${x},${y}`),
});

const objects: FieldObjectState[] = [
  {
    name: 'guide',
    persistState: true,
    tileX: 0,
    tileY: 2,
    facing: 'left',
    visible: false,
  },
  {
    name: 'ordinary',
    persistState: false,
    tileX: 2,
    tileY: 1,
    facing: 'down',
    visible: true,
  },
];

describe('field resume snapshot', () => {
  it('round-trips player facing and only uniquely named opt-in objects', () => {
    const snapshot = captureFieldResume({ mapKey: 'test-map', facing: 'up', objects });

    expect(snapshot).toEqual({
      facing: 'up',
      objects: {
        'test-map:guide': {
          map: 'test-map',
          tileX: 0,
          tileY: 2,
          facing: 'left',
          visible: false,
        },
      },
    });
    expect(
      resolveFieldResume({
        request: { targetMap: 'test-map', reason: 'script' },
        map: map(),
        requestedMap: 'test-map',
        requestedPosition: { x: 3, y: 1 },
        requestedFacing: snapshot.facing,
        objectDefinitions: objects,
        snapshot,
      }),
    ).toEqual({
      player: { x: 3, y: 1, facing: 'up', source: 'saved-position' },
      objects: snapshot.objects,
    });
  });

  it.each(['up', 'down', 'left', 'right'] as const)('preserves %s facing and zero coordinates', (facing) => {
    const snapshot = captureFieldResume({
      mapKey: 'test-map',
      facing,
      objects: [{ ...objects[0]!, facing, tileX: 0, tileY: 0 }],
    });

    expect(snapshot.facing).toBe(facing);
    expect(snapshot.objects['test-map:guide']).toMatchObject({ tileX: 0, tileY: 0, facing });
  });

  it('keeps other maps while replacing stale entries for the captured map', () => {
    const previous: FieldResumeSnapshot = {
      facing: 'right',
      objects: {
        'other-map:friend': {
          map: 'other-map',
          tileX: 1,
          tileY: 1,
          facing: 'right',
          visible: true,
        },
        'test-map:deleted': {
          map: 'test-map',
          tileX: 1,
          tileY: 1,
          facing: 'down',
          visible: true,
        },
      },
    };

    const captured = captureFieldResume({ mapKey: 'test-map', facing: 'left', objects, previous });

    expect(captured.objects['other-map:friend']).toEqual(previous.objects['other-map:friend']);
    expect(captured.objects['test-map:deleted']).toBeUndefined();
    expect(captured.objects['test-map:guide']).toBeDefined();
  });

  it('omits duplicate or empty object names instead of using unstable array order', () => {
    const duplicate = { ...objects[0]!, name: 'same' };
    const snapshot = captureFieldResume({
      mapKey: 'test-map',
      facing: 'down',
      objects: [duplicate, { ...duplicate, tileX: 1 }, { ...duplicate, name: '' }],
    });

    expect(snapshot.objects).toEqual({});
  });

  it('uses the canonical entry resolver when the saved player tile is blocked or outside the map', () => {
    for (const requestedPosition of [
      { x: 3, y: 2 },
      { x: 4, y: 0 },
    ]) {
      const restored = resolveFieldResume({
        request: { targetMap: 'test-map', reason: 'script' },
        map: map(new Set(['3,2'])),
        requestedMap: 'test-map',
        requestedPosition,
        requestedFacing: 'left',
        objectDefinitions: [],
        snapshot: { facing: 'left', objects: {} },
      });

      expect(restored.player).toEqual({ x: 0, y: 0, facing: 'down', source: 'default-spawn' });
    }
  });

  it('falls back invalid object state to current definitions and restores valid visible/facing state', () => {
    const snapshot: FieldResumeSnapshot = {
      facing: 'down',
      objects: {
        'test-map:guide': {
          map: 'test-map',
          tileX: 1,
          tileY: 1,
          facing: 'right',
          visible: true,
        },
        'test-map:ordinary': {
          map: 'test-map',
          tileX: 2,
          tileY: 1,
          facing: 'up',
          visible: false,
        },
        'test-map:blocked': {
          map: 'test-map',
          tileX: 3,
          tileY: 2,
          facing: 'left',
          visible: false,
        },
        'test-map:outside': {
          map: 'test-map',
          tileX: 4,
          tileY: 0,
          facing: 'down',
          visible: false,
        },
        'test-map:deleted': {
          map: 'test-map',
          tileX: 0,
          tileY: 1,
          facing: 'down',
          visible: false,
        },
      },
    };
    const definitions: FieldObjectState[] = [
      { ...objects[0]!, name: 'guide' },
      { ...objects[1]!, name: 'ordinary' },
      { ...objects[0]!, name: 'blocked' },
      { ...objects[0]!, name: 'outside' },
    ];

    const restored = resolveFieldResume({
      request: { targetMap: 'test-map', reason: 'script' },
      map: map(new Set(['3,2'])),
      requestedMap: 'another-map',
      requestedPosition: { x: 1, y: 1 },
      requestedFacing: 'down',
      objectDefinitions: definitions,
      snapshot,
    });

    expect(restored.objects).toEqual({ 'test-map:guide': snapshot.objects['test-map:guide'] });
  });

  it('ignores persisted state when the opt-in object name is duplicated in the current map', () => {
    const duplicate = { ...objects[0]!, name: 'same' };
    const snapshot: FieldResumeSnapshot = {
      facing: 'down',
      objects: {
        'test-map:same': {
          map: 'test-map',
          tileX: 1,
          tileY: 1,
          facing: 'up',
          visible: false,
        },
      },
    };

    expect(
      resolveFieldResume({
        request: { targetMap: 'test-map', reason: 'script' },
        map: map(),
        requestedMap: 'test-map',
        requestedPosition: { x: 2, y: 2 },
        requestedFacing: 'down',
        objectDefinitions: [duplicate, { ...duplicate, tileX: 1 }],
        snapshot,
      }).objects,
    ).toEqual({});
  });

  it('falls back to a safe map when a saved map was deleted', () => {
    expect(selectResumeMap('renamed-map', ['test-map', 'start-map'], 'start-map')).toBe('start-map');
    expect(selectResumeMap('test-map', ['test-map', 'start-map'], 'start-map')).toBe('test-map');
  });
});
