import type Phaser from 'phaser';
import type { MovementCommand } from '../../core/events/contracts';
import { runMapObjectMovement, type MapObjectDirection } from '../../core/events/mapObjectMovementRuntime';
import type { WanderingNpc } from './npcWander';
import {
  createMapObjectMovementPorts,
  type MapObjectWalkAnimation,
  type ScriptedMapObject,
} from './mapObjectMovementPorts';

export interface PhaserMapObjectMovementOptions<T extends WanderingNpc & ScriptedMapObject> {
  scene: Phaser.Scene;
  objects: Map<number, T>;
  objectsById?: ReadonlyMap<string, T>;
  blocked: Set<number>;
  tileSize: number;
  stepMs: number;
  inside(x: number, y: number): boolean;
  indexOf(x: number, y: number): number;
  isBlocked(x: number, y: number): boolean;
  isTransition(tile: number): boolean;
  playerTile(): readonly [number, number];
  frame(direction: MapObjectDirection, step: 0 | 1 | 2): number;
  onComplete?(): void;
}

function aborted(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}

function delay(scene: Phaser.Scene, durationMs: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', onAbort);
      action();
    };
    const timer = scene.time.delayedCall(durationMs, () => finish(resolve));
    const onAbort = () => {
      timer.remove(false);
      finish(() => reject(aborted(signal)));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function animateWalk<T extends WanderingNpc & ScriptedMapObject>(
  scene: Phaser.Scene,
  stepMs: number,
  input: MapObjectWalkAnimation<T>,
): Promise<void> {
  input.signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      input.signal.removeEventListener('abort', onAbort);
      action();
    };
    const tween = scene.tweens.add({
      targets: [input.object.sprite, input.object.shadow],
      x: input.toX,
      y: (target: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image) =>
        input.toY + (target === input.object.shadow ? 6 : 0),
      duration: stepMs * 2,
      onUpdate: (active) => input.onProgress(active.progress),
      onComplete: () => finish(resolve),
    });
    const onAbort = () => {
      tween.stop();
      finish(() => reject(aborted(input.signal)));
    };
    input.signal.addEventListener('abort', onAbort, { once: true });
  });
}

function showEmote<T extends WanderingNpc & ScriptedMapObject>(
  scene: Phaser.Scene,
  object: T,
  emote: string,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  const label = scene.add
    .text(object.sprite.x, object.sprite.y - 24, emote, {
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '14px',
      stroke: '#171329',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(object.sprite.depth + 32);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', onAbort);
      label.destroy();
      action();
    };
    const tween = scene.tweens.add({
      targets: label,
      y: label.y - 8,
      alpha: 0,
      duration: 600,
      ease: 'Stepped',
      easeParams: [3],
      onComplete: () => finish(resolve),
    });
    const onAbort = () => {
      tween.stop();
      finish(() => reject(aborted(signal)));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Creates the production field-event movement port for the active Overworld scene. */
export function createPhaserMapObjectMovementRunner<T extends WanderingNpc & ScriptedMapObject>(
  options: PhaserMapObjectMovementOptions<T>,
): (command: MovementCommand, signal: AbortSignal) => Promise<void> {
  return async (command, signal) => {
    const ports = createMapObjectMovementPorts({
      ...options,
      now: () => options.scene.time.now,
      delay: (durationMs, activeSignal) => delay(options.scene, durationMs, activeSignal),
      emote: (object, emote, activeSignal) => showEmote(options.scene, object, emote, activeSignal),
      animateWalk: (input) => animateWalk(options.scene, options.stepMs, input),
    });
    await runMapObjectMovement(command.objectId, command.commands, ports, { signal });
    options.onComplete?.();
  };
}
