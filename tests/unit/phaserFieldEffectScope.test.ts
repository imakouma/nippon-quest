import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { createEffectScope } from '../../src/core/lifecycle/effectScope';
import {
  ownFieldCameraEffect,
  ownFieldDomOverlay,
  ownFieldParticles,
  ownFieldTimer,
  ownFieldTween,
} from '../../src/scenes/overworld/phaserFieldEffectScope';

describe('Phaser field effect scope adapters', () => {
  it('registers existing Phaser and DOM resources without replacing their managers', () => {
    const scope = createEffectScope();
    const tween = { stop: vi.fn() } as unknown as Phaser.Tweens.Tween;
    const timer = { remove: vi.fn() } as unknown as Phaser.Time.TimerEvent;
    const particles = { destroy: vi.fn() } as unknown as Phaser.GameObjects.Particles.ParticleEmitter;
    const camera = { resetFX: vi.fn() } as unknown as Phaser.Cameras.Scene2D.Camera;
    const clearOverlay = vi.fn();

    expect(ownFieldTween(scope, tween)).toBe(tween);
    expect(ownFieldTimer(scope, timer)).toBe(timer);
    expect(ownFieldParticles(scope, particles)).toBe(particles);
    expect(ownFieldCameraEffect(scope, camera)).toBe(camera);
    ownFieldDomOverlay(scope, clearOverlay);

    scope.dispose('complete');
    scope.dispose('again');

    expect(tween.stop).toHaveBeenCalledOnce();
    expect(timer.remove).toHaveBeenCalledOnce();
    expect(timer.remove).toHaveBeenCalledWith(false);
    expect(particles.destroy).toHaveBeenCalledOnce();
    expect(camera.resetFX).toHaveBeenCalledOnce();
    expect(clearOverlay).toHaveBeenCalledOnce();
  });
});
