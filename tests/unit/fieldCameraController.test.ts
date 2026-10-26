import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import {
  FIELD_CAMERA_ZOOM,
  PhaserFieldCameraController,
} from '../../src/scenes/overworld/fieldCameraController';
import { cameraScrollForPoint } from '../../src/scenes/overworld/fieldCameraMath';

interface TestHarness {
  camera: Phaser.Cameras.Scene2D.Camera;
  calls: {
    panCallbacks: Phaser.Types.Cameras.Scene2D.CameraPanCallback[];
    shutdown?: () => void;
  };
  scene: Phaser.Scene;
}

function harness(): TestHarness {
  const calls: TestHarness['calls'] = { panCallbacks: [] };
  const camera = {
    width: 960,
    height: 540,
    zoom: FIELD_CAMERA_ZOOM,
    rotation: 0,
    scrollX: 0,
    scrollY: 0,
    panEffect: { reset: vi.fn() },
    setBounds: vi.fn(function (this: object) {
      return this;
    }),
    setZoom: vi.fn(function (this: { zoom: number }, zoom: number) {
      this.zoom = zoom;
      return this;
    }),
    setRotation: vi.fn(function (this: { rotation: number }, rotation: number) {
      this.rotation = rotation;
      return this;
    }),
    setRoundPixels: vi.fn(function (this: object) {
      return this;
    }),
    setScroll: vi.fn(function (this: { scrollX: number; scrollY: number }, x: number, y: number) {
      this.scrollX = x;
      this.scrollY = y;
      return this;
    }),
    startFollow: vi.fn(function (this: object) {
      return this;
    }),
    stopFollow: vi.fn(function (this: object) {
      return this;
    }),
    resetFX: vi.fn(function (this: object) {
      return this;
    }),
    pan: vi.fn(function (
      this: object,
      _x: number,
      _y: number,
      _duration: number,
      _ease: string,
      _force: boolean,
      callback: Phaser.Types.Cameras.Scene2D.CameraPanCallback,
    ) {
      calls.panCallbacks.push(callback);
      return this;
    }),
  } as unknown as Phaser.Cameras.Scene2D.Camera;
  const scene = {
    cameras: { main: camera },
    events: {
      once: vi.fn((_event: string, callback: () => void) => {
        calls.shutdown = callback;
      }),
      off: vi.fn(),
    },
  } as unknown as Phaser.Scene;
  return { camera, calls, scene };
}

const bounds = { x: 0, y: 0, width: 2_000, height: 2_000 };

describe('cameraScrollForPoint', () => {
  it('rounds centered 960x540 scroll after applying 3x zoom', () => {
    expect(
      cameraScrollForPoint({ x: 500.4, y: 400.6 }, { width: 960, height: 540, zoom: 3 }, bounds),
    ).toEqual({ x: 340, y: 311 });
  });

  it('clamps the rounded target at every map edge', () => {
    const viewport = { width: 960, height: 540, zoom: 3 };

    expect(cameraScrollForPoint({ x: 0, y: 0 }, viewport, bounds)).toEqual({ x: 0, y: 0 });
    expect(cameraScrollForPoint({ x: 2_000, y: 2_000 }, viewport, bounds)).toEqual({
      x: 1_680,
      y: 1_820,
    });
  });

  it('keeps an undersized map anchored at its integer bounds origin', () => {
    expect(
      cameraScrollForPoint(
        { x: 40, y: 40 },
        { width: 960, height: 540, zoom: 3 },
        { x: 10, y: 20, width: 100, height: 80 },
      ),
    ).toEqual({ x: 10, y: 20 });
  });
});

describe('PhaserFieldCameraController', () => {
  it('resets field invariants and follows the player from an integer scroll target', () => {
    const { camera, scene } = harness();
    const controller = new PhaserFieldCameraController(scene, () => bounds);
    const player = { x: 500.4, y: 400.6 } as Phaser.GameObjects.Components.Transform;

    controller.resetForMap();
    controller.followPlayer(player);

    expect(camera.setBounds).toHaveBeenCalledWith(0, 0, 2_000, 2_000);
    expect(camera.setZoom).toHaveBeenCalledWith(3);
    expect(camera.setRotation).toHaveBeenCalledWith(0);
    expect(camera.setRoundPixels).toHaveBeenCalledWith(true);
    expect(camera.setScroll).toHaveBeenLastCalledWith(340, 311);
    expect(camera.startFollow).toHaveBeenCalledWith(player, true, 0.2, 0.2);
  });

  it('focuses, then returns to the latest player position and resumes follow', async () => {
    const { camera, calls, scene } = harness();
    const controller = new PhaserFieldCameraController(scene, () => bounds);
    const player = { x: 500, y: 400 } as Phaser.GameObjects.Components.Transform;
    controller.followPlayer(player);
    vi.mocked(camera.startFollow).mockClear();

    const focus = controller.focusAt({ x: 900, y: 700 }, 240);
    expect(camera.stopFollow).toHaveBeenCalledOnce();
    expect(camera.pan).toHaveBeenCalledWith(900, 700, 240, 'Linear', true, expect.any(Function));
    calls.panCallbacks[0]!(camera, 1, 740, 610);
    await focus;
    expect(camera.setScroll).toHaveBeenLastCalledWith(740, 610);
    expect(camera.startFollow).not.toHaveBeenCalled();

    player.x = 650.2;
    player.y = 450.8;
    const returning = controller.returnToPlayer(180);
    expect(camera.pan).toHaveBeenLastCalledWith(650.2, 450.8, 180, 'Linear', true, expect.any(Function));
    calls.panCallbacks[1]!(camera, 1, 490.2, 360.8);
    await returning;
    expect(camera.setScroll).toHaveBeenLastCalledWith(490, 361);
    expect(camera.startFollow).toHaveBeenCalledWith(player, true, 0.2, 0.2);
    expect(camera.setBounds).not.toHaveBeenCalled();
    expect(camera.setZoom).not.toHaveBeenCalled();
    expect(camera.setRotation).not.toHaveBeenCalled();
    expect(camera.resetFX).not.toHaveBeenCalled();
  });

  it('resolves an interrupted task and ignores its stale completion', async () => {
    const { camera, calls, scene } = harness();
    const controller = new PhaserFieldCameraController(scene, () => bounds);

    const stale = controller.focusAt({ x: 400, y: 400 }, 300);
    const current = controller.focusAt({ x: 1_000, y: 800 }, 300);
    await stale;
    expect(camera.panEffect.reset).toHaveBeenCalledOnce();

    calls.panCallbacks[0]!(camera, 1, 240, 310);
    expect(camera.setScroll).not.toHaveBeenCalled();
    calls.panCallbacks[1]!(camera, 1, 840, 710);
    await current;
    expect(camera.setScroll).toHaveBeenLastCalledWith(840, 710);
  });

  it('cancels camera tasks on map reset without clearing fade or flash effects', async () => {
    const { camera, scene } = harness();
    const controller = new PhaserFieldCameraController(scene, () => bounds);
    const focus = controller.focusAt({ x: 900, y: 700 }, 240);

    controller.resetForMap();
    await focus;

    expect(camera.panEffect.reset).toHaveBeenCalledOnce();
    expect(camera.resetFX).not.toHaveBeenCalled();
  });

  it('cancels work and becomes inert after destroy or scene shutdown', async () => {
    const { camera, calls, scene } = harness();
    const controller = new PhaserFieldCameraController(scene, () => bounds);
    const focus = controller.focusAt({ x: 900, y: 700 }, 240);

    calls.shutdown?.();
    await focus;
    await controller.focusAt({ x: 1_000, y: 800 }, 300);

    expect(camera.panEffect.reset).toHaveBeenCalledOnce();
    expect(camera.stopFollow).toHaveBeenCalled();
    expect(camera.pan).toHaveBeenCalledOnce();
  });
});
