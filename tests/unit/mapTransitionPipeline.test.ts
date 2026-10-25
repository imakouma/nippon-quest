import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  runMapTransition,
  type MapTransitionPorts,
  type MapTransitionRequest,
} from '../../src/scenes/overworld/mapTransitionPipeline';
import { resolveMapEntry, type MapEntryMap } from '../../src/scenes/overworld/mapEntry';
import { mapTransitionRequestFromSceneData } from '../../src/scenes/overworld/mapSceneEntry';

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

afterEach(() => vi.useRealTimers());

describe('mapTransitionRequestFromSceneData', () => {
  it('preserves typed requests and converts legacy scene data', () => {
    const typed = request({ reason: 'defeat' });
    expect(mapTransitionRequestFromSceneData({ transitionRequest: typed }, 'fallback')).toBe(typed);
    expect(
      mapTransitionRequestFromSceneData(
        { mapKey: 'legacy-map', spawnName: 'door', spawnTile: [2, 3], exactSpawn: true },
        'fallback',
      ),
    ).toEqual({
      targetMap: 'legacy-map',
      spawnName: 'door',
      tile: [2, 3],
      exactSpawn: true,
      reason: 'script',
    });
  });
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

describe('runMapTransition', () => {
  const ports = (overrides: Partial<MapTransitionPorts> = {}): MapTransitionPorts => ({
    closeTransientUi: vi.fn(),
    fadeOut: vi.fn().mockResolvedValue(undefined),
    restart: vi.fn(),
    ...overrides,
  });

  it('closes transient UI, waits for fade, then restarts in order', async () => {
    const phases: string[] = [];
    let finishFade: (() => void) | undefined;
    const transition = runMapTransition(
      request(),
      ports({
        closeTransientUi: () => phases.push('close'),
        fadeOut: () =>
          new Promise<void>((resolve) => {
            phases.push('fade');
            finishFade = resolve;
          }),
        restart: () => phases.push('restart'),
      }),
      new AbortController().signal,
    );

    expect(phases).toEqual(['close', 'fade']);
    finishFade?.();
    await transition;
    expect(phases).toEqual(['close', 'fade', 'restart']);
  });

  it('restarts once when fade completion races the 600ms fallback', async () => {
    vi.useFakeTimers();
    let finishFade: (() => void) | undefined;
    const transitionPorts = ports({
      fadeOut: () => new Promise<void>((resolve) => (finishFade = resolve)),
    });
    const transition = runMapTransition(request(), transitionPorts, new AbortController().signal);

    await vi.advanceTimersByTimeAsync(600);
    await transition;
    finishFade?.();
    await Promise.resolve();

    expect(transitionPorts.restart).toHaveBeenCalledTimes(1);
  });

  it('does not begin or restart when already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const transitionPorts = ports();

    await runMapTransition(request(), transitionPorts, controller.signal);

    expect(transitionPorts.closeTransientUi).not.toHaveBeenCalled();
    expect(transitionPorts.fadeOut).not.toHaveBeenCalled();
    expect(transitionPorts.restart).not.toHaveBeenCalled();
  });

  it('does not restart when aborted during fade', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const transitionPorts = ports({ fadeOut: () => new Promise<void>(() => undefined) });
    const transition = runMapTransition(request(), transitionPorts, controller.signal);

    controller.abort();
    await transition;
    await vi.advanceTimersByTimeAsync(600);

    expect(transitionPorts.restart).not.toHaveBeenCalled();
  });

  it('propagates fade failures without restarting', async () => {
    const error = new Error('fade failed');
    const transitionPorts = ports({ fadeOut: vi.fn().mockRejectedValue(error) });

    await expect(runMapTransition(request(), transitionPorts, new AbortController().signal)).rejects.toBe(
      error,
    );
    expect(transitionPorts.restart).not.toHaveBeenCalled();
  });

  it('does not treat an undefined rejection value as a successful fade', async () => {
    const transitionPorts = ports({ fadeOut: vi.fn().mockRejectedValue(undefined) });

    await expect(
      runMapTransition(request(), transitionPorts, new AbortController().signal),
    ).rejects.toBeUndefined();
    expect(transitionPorts.restart).not.toHaveBeenCalled();
  });

  it('restarts with the request values captured at invocation time', async () => {
    let finishFade: (() => void) | undefined;
    const mutable: MapTransitionRequest = request({ tile: [1, 2] });
    const transitionPorts = ports({
      fadeOut: () => new Promise<void>((resolve) => (finishFade = resolve)),
    });
    const transition = runMapTransition(mutable, transitionPorts, new AbortController().signal);

    mutable.targetMap = 'changed-map';
    mutable.tile = [3, 0];
    finishFade?.();
    await transition;

    expect(transitionPorts.restart).toHaveBeenCalledWith({
      targetMap: 'test-map',
      reason: 'door',
      tile: [1, 2],
    });
  });
});
