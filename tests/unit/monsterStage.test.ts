import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { battleLayout } from '../../src/scenes/battle/layout';
import {
  monsterBodyGroundY,
  monsterBodyTargetHeight,
  monsterFrameVisibleBounds,
} from '../../src/scenes/battle/monsterStage';

it('フレームの透過余白を一度の画像読取で調べ、同じフレームは再利用する', () => {
  const pixels = new Uint8ClampedArray(6 * 5 * 4);
  pixels[(1 * 6 + 2) * 4 + 3] = 255;
  pixels[(3 * 6 + 4) * 4 + 3] = 255;
  const context = { drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: pixels })) };
  const canvas = { width: 0, height: 0, getContext: vi.fn(() => context) };
  const source = {};
  const textures = {
    getFrame: vi.fn(() => ({
      source: { image: source },
      cutX: 7,
      cutY: 8,
      cutWidth: 3,
      cutHeight: 3,
      x: 2,
      y: 1,
    })),
    getPixelAlpha: vi.fn(),
  } as unknown as Phaser.Textures.TextureManager;
  vi.stubGlobal('document', { createElement: () => canvas });
  try {
    expect(monsterFrameVisibleBounds(textures, 'monster', 0, 6, 5)).toEqual({
      x: 2,
      y: 1,
      width: 3,
      height: 3,
    });
    expect(monsterFrameVisibleBounds(textures, 'monster', 0, 6, 5)).toEqual({
      x: 2,
      y: 1,
      width: 3,
      height: 3,
    });
    expect(context.drawImage).toHaveBeenCalledWith(source, 7, 8, 3, 3, 2, 1, 3, 3);
    expect(context.getImageData).toHaveBeenCalledTimes(1);
    expect(textures.getPixelAlpha).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});

it('画像を一括で読めない場合は従来の画素取得に戻す', () => {
  const textures = {
    getFrame: () => null,
    getPixelAlpha: vi.fn((x: number, y: number) => (x === 1 && y === 2 ? 255 : 0)),
  } as unknown as Phaser.Textures.TextureManager;
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => null }) });
  try {
    expect(monsterFrameVisibleBounds(textures, 'fallback', 0, 4, 4)).toEqual({
      x: 1,
      y: 2,
      width: 1,
      height: 1,
    });
    expect(textures.getPixelAlpha).toHaveBeenCalledTimes(16);
  } finally {
    vi.unstubAllGlobals();
  }
});

describe('キャラ固有身長の戦闘表示高', () => {
  it('旧サイドビューでは100cmを96pxとして大型ほど強く反映する', () => {
    const layout = battleLayout('side');

    expect(monsterBodyTargetHeight(10, layout)).toBe(48);
    expect(monsterBodyTargetHeight(32, layout)).toBeCloseTo(51.3, 1);
    expect(monsterBodyTargetHeight(38, layout)).toBeCloseTo(56.38, 1);
    expect(monsterBodyTargetHeight(100, layout)).toBe(96);
    expect(monsterBodyTargetHeight(120, layout)).toBeCloseTo(106.13, 1);
    expect(monsterBodyTargetHeight(350, layout)).toBeCloseTo(191.21, 1);
    expect(monsterBodyTargetHeight(580, layout)).toBe(250);
  });

  it('正式な奥行きビューでは下限60pxと上限250pxへ収める', () => {
    const layout = battleLayout('depth');

    expect(monsterBodyTargetHeight(10, layout)).toBe(60);
    expect(monsterBodyTargetHeight(100, layout)).toBe(96);
    expect(monsterBodyTargetHeight(580, layout)).toBe(250);
  });

  it('大型の敵だけ足元を下げて身体上端の安全ラインを守る', () => {
    const layout = battleLayout('depth');
    const sideLayout = battleLayout('side');

    expect(monsterBodyGroundY(60, layout)).toBe(layout.enemy.y);
    expect(monsterBodyGroundY(106.13, layout)).toBe(layout.enemy.y);
    expect(monsterBodyGroundY(191.21, layout)).toBeCloseTo(331.21, 2);
    expect(monsterBodyGroundY(250, layout)).toBe(390);
    expect(monsterBodyGroundY(250, layout) - 250).toBe(layout.enemy.minBodyTop);
    expect(monsterBodyGroundY(250, sideLayout)).toBe(sideLayout.enemy.y);
  });

  it('設定身長が大きいほど画面上の身体高が小さくならない', () => {
    const layout = battleLayout('depth');
    const heights = [10, 16, 32, 38, 100, 120, 350, 580].map((cm) => monsterBodyTargetHeight(cm, layout));

    expect(heights).toEqual([...heights].sort((a, b) => a - b));
  });
});
