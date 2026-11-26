import { expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { addImage, addSheet } from '../../src/rendering/sheet';

it('完成済みの Canvas を読み戻さず登録し、通常の追加イベントを送る', () => {
  const texture = { add: vi.fn() };
  const manager = {
    exists: vi.fn(() => false),
    create: vi.fn(() => texture),
    emit: vi.fn(),
    addCanvas: vi.fn(),
  } as unknown as Phaser.Textures.TextureManager;
  const canvas = { width: 32, height: 16 } as HTMLCanvasElement;

  addSheet(manager, 'sheet', canvas, 16, 16);
  expect(manager.create).toHaveBeenCalledWith('sheet', canvas);
  expect(manager.addCanvas).not.toHaveBeenCalled();
  expect(texture.add.mock.calls).toEqual([
    ['__BASE', 0, 0, 0, 32, 16],
    [0, 0, 0, 0, 16, 16],
    [1, 0, 16, 0, 16, 16],
  ]);
  expect(manager.emit).toHaveBeenCalledWith('addtexture', 'sheet', texture);
  expect(manager.emit).toHaveBeenCalledWith('addtexture-sheet', texture);

  vi.mocked(manager.exists).mockReturnValue(true);
  addImage(manager, 'sheet', canvas);
  expect(manager.create).toHaveBeenCalledTimes(1);
});
