import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { createEffectScope } from '../../src/core/lifecycle/effectScope';
import { createPhaserMapTransitionPorts } from '../../src/scenes/overworld/phaserMapTransitionPorts';

vi.mock('phaser', () => ({
  default: {
    Cameras: { Scene2D: { Events: { FADE_OUT_COMPLETE: 'camerafadeoutcomplete' } } },
  },
}));

describe('Phaser map transition ports', () => {
  it('owns the camera effect and ignores a late fade completion after disposal', async () => {
    let completeFade: (() => void) | undefined;
    const camera = {
      once: vi.fn((_event: string, callback: () => void) => {
        completeFade = callback;
      }),
      off: vi.fn(),
      fadeOut: vi.fn(),
      resetFX: vi.fn(),
    };
    const restart = vi.fn();
    const scene = {
      cameras: { main: camera },
      scene: { restart },
    } as unknown as Phaser.Scene;
    const scope = createEffectScope();
    const ports = createPhaserMapTransitionPorts(scene, vi.fn(), scope);

    const fading = ports.fadeOut(scope.signal);
    scope.dispose('scene-shutdown');
    await fading;
    completeFade?.();

    expect(camera.resetFX).toHaveBeenCalledOnce();
    expect(camera.off).toHaveBeenCalledOnce();
    expect(restart).not.toHaveBeenCalled();
  });
});
