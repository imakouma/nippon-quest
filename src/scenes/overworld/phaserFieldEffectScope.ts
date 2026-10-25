import type Phaser from 'phaser';
import type { EffectScope } from '../../core/lifecycle/effectScope';

export function ownFieldTween<T extends Phaser.Tweens.Tween>(scope: EffectScope, tween: T): T {
  scope.register(() => tween.stop());
  return tween;
}

export function ownFieldTimer<T extends Phaser.Time.TimerEvent>(scope: EffectScope, timer: T): T {
  scope.register(() => timer.remove(false));
  return timer;
}

export function ownFieldParticles<T extends Phaser.GameObjects.Particles.ParticleEmitter>(
  scope: EffectScope,
  particles: T,
): T {
  scope.register(() => particles.destroy());
  return particles;
}

export function ownFieldCameraEffect<T extends Phaser.Cameras.Scene2D.Camera>(
  scope: EffectScope,
  camera: T,
): T {
  scope.register(() => camera.resetFX());
  return camera;
}

export function ownFieldDomOverlay(scope: EffectScope, clear: () => void): void {
  scope.register(clear);
}
