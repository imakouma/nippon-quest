import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';

const { release, duck } = vi.hoisted(() => {
  const release = vi.fn();
  return { release, duck: vi.fn(() => release) };
});
vi.mock('phaser', () => ({ default: { Scenes: { Events: { SHUTDOWN: 'shutdown' } } } }));
vi.mock('../../src/scenes/shared/music', () => ({ attachSceneMusic: () => ({ duck }) }));
import { attachBattleBgm, withBattleMusicDucked } from '../../src/scenes/battle/bgm';

describe('戦闘演出の音量復帰', () => {
  it.each([false, true])('演出失敗=%sでも減音を必ず解除する', async (fail) => {
    release.mockClear();
    duck.mockClear();
    attachBattleBgm({ events: { once: vi.fn() } } as unknown as Phaser.Scene, false, () => undefined);
    const animation = withBattleMusicDucked(async () => {
      expect(duck).toHaveBeenCalledOnce();
      expect(release).not.toHaveBeenCalled();
      if (fail) throw new Error('animation failed');
    });
    if (fail) await expect(animation).rejects.toThrow('animation failed');
    else await animation;
    expect(release).toHaveBeenCalledOnce();
  });
});
