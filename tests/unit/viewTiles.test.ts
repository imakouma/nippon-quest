import type Phaser from 'phaser';
import { afterEach, expect, it, vi } from 'vitest';
import { NQ } from '../../src/rendering/palette';
import { VIEW, VIEW_COUNT } from '../../src/rendering/overworld/overworldView';
import { buildViewTexture, VIEW_COLS } from '../../src/rendering/overworld/viewTiles';

afterEach(() => vi.unstubAllGlobals());

it('atlas 内を palette 色で描き、孤立した森と砂の両側の角を丸める', () => {
  const pixels = new Map<string, string>();
  const palette = new Set<string>(Object.values(NQ));
  const invalid: string[] = [];
  const context = {
    fillStyle: '',
    fillRect(x: number, y: number, width: number, height: number) {
      if (
        width !== 1 ||
        height !== 1 ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < 0 ||
        y < 0 ||
        x >= canvas.width ||
        y >= canvas.height ||
        !palette.has(this.fillStyle)
      ) {
        invalid.push(`${x},${y}: ${width}x${height} ${this.fillStyle}`);
      }
      pixels.set(`${x},${y}`, this.fillStyle);
    },
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  vi.stubGlobal('document', { createElement: () => canvas });
  const textures = {
    exists: () => false,
    emit: () => undefined,
    create: vi.fn(() => ({ add: () => undefined })),
  };
  buildViewTexture({ textures } as unknown as Phaser.Scene);
  expect(invalid).toEqual([]);
  expect(canvas.width).toBe(VIEW_COLS * 16);
  expect(canvas.height).toBe(Math.ceil(VIEW_COUNT / VIEW_COLS) * 16);
  expect(textures.create).toHaveBeenCalledOnce();
  const pixel = (tile: number, x: number, y: number) =>
    pixels.get(`${(tile % VIEW_COLS) * 16 + x},${Math.floor(tile / VIEW_COLS) * 16 + y}`);
  for (const tile of [VIEW.FOREST, VIEW.SAND_EDGE]) {
    expect(pixel(tile, 1, 2)).toBe(NQ.leaf);
    expect(pixel(tile, 14, 2)).toBe(NQ.leaf);
  }
  expect(pixel(VIEW.WATER + 1, 0, 0)).toBe(NQ.sky);
  expect(pixel(VIEW.WATER + 1, 1, 0)).toBe(NQ.white);
  expect(pixel(VIEW.ORCHARD_ALT, 5, 4)).toBe(NQ.red);
  expect(pixel(VIEW.ORCHARD_PEACH_ALT, 5, 4)).toBe(NQ.blush);
  expect(pixel(VIEW.CLIFF, 8, 0)).toBe(NQ.leaf);
  expect(pixel(VIEW.CLIFF, 8, 8)).toBe(NQ.tan);
  expect(pixel(VIEW.STAIRS, 8, 4)).toBe(NQ.gray);
  expect(pixel(VIEW.STAIRS, 2, 14)).toBe(NQ.slate);
  expect(pixel(VIEW.STAIRS_LEFT, 1, 8)).toBe(NQ.night);
  expect(pixel(VIEW.STAIRS_RIGHT, 14, 8)).toBe(NQ.night);
});
