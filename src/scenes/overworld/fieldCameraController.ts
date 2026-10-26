import type Phaser from 'phaser';
import { cameraScrollForPoint, type CameraBounds, type CameraPoint } from './fieldCameraMath';

export const FIELD_CAMERA_ZOOM = 3;
const FOLLOW_LERP = 0.2;

export interface FieldCameraController {
  followPlayer(target: Phaser.GameObjects.Components.Transform): void;
  focusAt(point: CameraPoint, durationMs: number): Promise<void>;
  returnToPlayer(durationMs: number): Promise<void>;
  resetForMap(): void;
  destroy(): void;
}

interface CameraTask {
  resolve: () => void;
}

/** Owns field-camera scroll without touching fade, flash, or other visual effects. */
export class PhaserFieldCameraController implements FieldCameraController {
  private player: Phaser.GameObjects.Components.Transform | null = null;
  private task: CameraTask | null = null;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly getBounds: () => CameraBounds,
    private readonly camera = scene.cameras.main,
  ) {
    scene.events.once('shutdown', this.onShutdown);
  }

  followPlayer(target: Phaser.GameObjects.Components.Transform): void {
    if (this.destroyed) return;
    this.player = target;
    this.cancelTask();
    this.startFollow();
  }

  focusAt(point: CameraPoint, durationMs: number): Promise<void> {
    return this.moveTo({ ...point }, durationMs, false);
  }

  returnToPlayer(durationMs: number): Promise<void> {
    if (!this.player) {
      this.cancelTask();
      return Promise.resolve();
    }
    return this.moveTo({ x: this.player.x, y: this.player.y }, durationMs, true);
  }

  resetForMap(): void {
    if (this.destroyed) return;
    this.cancelTask();
    this.camera.stopFollow();
    const bounds = this.getBounds();
    this.camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    this.camera.setZoom(FIELD_CAMERA_ZOOM);
    this.camera.setRotation(0);
    this.camera.setRoundPixels(true);
    if (this.player) this.startFollow();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cancelTask();
    this.camera.stopFollow();
    this.player = null;
    this.scene.events.off('shutdown', this.onShutdown);
  }

  private moveTo(point: CameraPoint, durationMs: number, resumeFollow: boolean): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    this.cancelTask();
    this.camera.stopFollow();
    if (durationMs <= 0) {
      this.snapTo(resumeFollow && this.player ? this.player : point);
      if (resumeFollow) this.startFollow();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const task = { resolve };
      this.task = task;
      this.camera.pan(point.x, point.y, durationMs, 'Linear', true, (_camera, progress) => {
        if (progress < 1 || this.task !== task) return;
        this.task = null;
        this.snapTo(resumeFollow && this.player ? this.player : point);
        if (resumeFollow) this.startFollow();
        resolve();
      });
    });
  }

  private startFollow(): void {
    if (!this.player) return;
    this.snapTo(this.player);
    this.camera.startFollow(this.player, true, FOLLOW_LERP, FOLLOW_LERP);
  }

  private snapTo(point: CameraPoint): void {
    const scroll = cameraScrollForPoint(
      point,
      { width: this.camera.width, height: this.camera.height, zoom: this.camera.zoom },
      this.getBounds(),
    );
    this.camera.setScroll(scroll.x, scroll.y);
  }

  private cancelTask(): void {
    const task = this.task;
    if (!task) return;
    this.task = null;
    this.camera.panEffect.reset();
    task.resolve();
  }

  private readonly onShutdown = (): void => this.destroy();
}

export function attachFieldCamera(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.Components.Transform,
  map: Pick<Phaser.Tilemaps.Tilemap, 'widthInPixels' | 'heightInPixels'>,
): FieldCameraController {
  const controller = new PhaserFieldCameraController(scene, () => ({
    x: 0,
    y: 0,
    width: map.widthInPixels,
    height: map.heightInPixels,
  }));
  controller.resetForMap();
  controller.followPlayer(player);
  return controller;
}
