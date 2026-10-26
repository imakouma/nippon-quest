import { describe, expect, it, vi } from 'vitest';
import { runMapObjectMovement } from '../../src/core/events/mapObjectMovementRuntime';
import {
  createMapObjectMovementPorts,
  type MapObjectMovementScene,
  type ScriptedMapObject,
} from '../../src/scenes/overworld/mapObjectMovementPorts';

function displayObject(x: number, y: number) {
  return {
    x,
    y,
    visible: true,
    frame: 0,
    depth: y,
    setPosition(nextX: number, nextY: number) {
      this.x = nextX;
      this.y = nextY;
      return this;
    },
    setFrame(frame: number) {
      this.frame = frame;
      return this;
    },
    setVisible(visible: boolean) {
      this.visible = visible;
      return this;
    },
    setDepth(depth: number) {
      this.depth = depth;
      return this;
    },
  };
}

function harness() {
  const tileSize = 16;
  const sprite = displayObject(24, 24);
  const shadow = displayObject(24, 30);
  const object: ScriptedMapObject = {
    key: 'npc-guide',
    tile: 11,
    facing: 'down',
    sprite,
    shadow,
    moving: false,
    nextMoveAt: 0,
  };
  const objects = new Map([[11, object]]);
  const blocked = new Set([11]);
  const emote = vi.fn(async () => undefined);
  const delay = vi.fn(async () => undefined);
  const scene: MapObjectMovementScene<ScriptedMapObject> = {
    objects,
    objectsById: new Map([[object.key, object]]),
    blocked,
    tileSize,
    stepMs: 120,
    inside: (x, y) => x >= 0 && y >= 0 && x < 10 && y < 10,
    indexOf: (x, y) => y * 10 + x,
    isBlocked: (x, y) => blocked.has(y * 10 + x),
    isTransition: () => false,
    playerTile: () => [0, 0],
    frame: (_direction: 'down' | 'left' | 'right' | 'up', step: 0 | 1 | 2) => step,
    now: () => 500,
    delay,
    emote,
    animateWalk: async ({ object: moving, toX, toY, onProgress }) => {
      onProgress(0.75);
      moving.sprite.setPosition(toX, toY);
      moving.shadow.setPosition(toX, toY + 6);
    },
  };
  const ports = createMapObjectMovementPorts(scene);
  return { blocked, delay, emote, object, objects, ports, scene, shadow, sprite };
}

describe('map object movement scene ports', () => {
  it('既存NPCを予約して歩かせ、map occupancyを到着マスへ移す', async () => {
    const h = harness();

    await expect(
      runMapObjectMovement(
        'npc-guide',
        [
          { type: 'face', direction: 'right' },
          { type: 'walk', direction: 'right' },
          { type: 'hide' },
          { type: 'show' },
          { type: 'emote', emote: '!' },
          { type: 'wait', durationMs: 40 },
        ],
        h.ports,
        { signal: new AbortController().signal },
      ),
    ).resolves.toEqual({ executedSteps: 6 });

    expect([...h.objects.keys()]).toEqual([12]);
    expect([...h.blocked]).toEqual([12]);
    expect(h.sprite.x).toBe(40);
    expect(h.sprite.visible).toBe(true);
    expect(h.shadow.visible).toBe(true);
    expect(h.emote).toHaveBeenCalledWith(h.object, '!', expect.any(AbortSignal));
    expect(h.delay).toHaveBeenCalledWith(40, expect.any(AbortSignal));
    expect(h.object.moving).toBe(false);
    expect(h.object.tile).toBe(12);
    expect(h.object.facing).toBe('right');
  });

  it('衝突中の到着マスは予約せず、元マスを維持する', async () => {
    const h = harness();
    h.blocked.add(12);

    await expect(
      runMapObjectMovement('npc-guide', [{ type: 'walk', direction: 'right' }], h.ports, {
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({ code: 'BLOCKED' });

    expect([...h.objects.keys()]).toEqual([11]);
    expect(h.blocked.has(11)).toBe(true);
    expect(h.object.moving).toBe(false);
    expect(h.object.tile).toBe(11);
  });

  it('非表示中は interaction と collision の占有を外し、再表示で元マスへ戻す', async () => {
    const h = harness();
    const signal = new AbortController().signal;

    await h.ports.setVisible('npc-guide', false, signal);
    expect([...h.objects.keys()]).toEqual([]);
    expect([...h.blocked]).toEqual([]);

    await h.ports.setVisible('npc-guide', true, signal);
    expect([...h.objects.keys()]).toEqual([11]);
    expect([...h.blocked]).toEqual([11]);
  });

  it('歩行中断時は見た目とoccupancyを出発マスへ戻す', async () => {
    const h = harness();
    const controller = new AbortController();
    h.ports = createMapObjectMovementPorts({
      ...h.scene,
      animateWalk: async ({ object, toX, toY, onProgress, signal }) => {
        onProgress(0.75);
        object.sprite.setPosition(toX, toY);
        object.shadow.setPosition(toX, toY + 6);
        controller.abort(new Error('scene shutdown'));
        signal.throwIfAborted();
      },
    });

    await expect(
      runMapObjectMovement('npc-guide', [{ type: 'walk', direction: 'right' }], h.ports, {
        signal: controller.signal,
      }),
    ).rejects.toThrow('scene shutdown');

    expect([...h.objects.keys()]).toEqual([11]);
    expect([...h.blocked]).toEqual([11]);
    expect(h.sprite.x).toBe(24);
    expect(h.shadow.y).toBe(30);
  });

  it('対象が見つからない場合はcleanupで例外を重ねず、元の診断を返す', async () => {
    const h = harness();
    h.objects.clear();
    h.blocked.clear();

    await expect(
      runMapObjectMovement('missing-npc', [{ type: 'face', direction: 'down' }], h.ports, {
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow('map object "missing-npc" was not found');
  });
});
