import { afterEach, expect, it, vi } from 'vitest';
import { NQ, NQ48 } from '../../src/rendering/palette';
import {
  TOWN_FARM_TILE,
  TOWN_GROUND_COUNT,
  TOWN_ROOFS,
  TOWN_ROOF_START,
  TOWN_SHOP_START,
} from '../../src/rendering/overworld/townView';
import { buildTownViewTexture } from '../../src/rendering/overworld/townViewArt';

afterEach(() => vi.unstubAllGlobals());

it('屋根の表示タイルはパレット内の色で不透明に塗られる', () => {
  const pixels = new Map<string, string>();
  const context = {
    fillStyle: '',
    fillRect(x: number, y: number, width: number, height: number) {
      for (let py = y; py < y + height; py++)
        for (let px = x; px < x + width; px++) pixels.set(`${px},${py}`, this.fillStyle);
    },
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  vi.stubGlobal('document', { createElement: () => canvas });
  const scene = {
    textures: { exists: () => false, emit: () => undefined, create: () => ({ add: () => undefined }) },
  };
  buildTownViewTexture(scene as unknown as Parameters<typeof buildTownViewTexture>[0]);

  const invalid = new Set<string | undefined>();
  for (
    let tile = TOWN_ROOF_START;
    tile < TOWN_ROOF_START + TOWN_GROUND_COUNT * TOWN_ROOFS.length * 16;
    tile++
  ) {
    const originX = (tile % 8) * 16;
    const originY = Math.floor(tile / 8) * 16;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const color = pixels.get(`${originX + x},${originY + y}`);
        if (!color || !NQ48.includes(color)) invalid.add(color);
      }
  }
  expect([...invalid]).toEqual([]);
  const roofPixel = (roof: number, x: number, y: number, mask = 15, ground = 0) => {
    const tile = TOWN_ROOF_START + (ground * TOWN_ROOFS.length + roof) * 16 + mask;
    return pixels.get(`${(tile % 8) * 16 + x},${Math.floor(tile / 8) * 16 + y}`);
  };
  const stoneTile = 15;
  expect(pixels.get(`${(stoneTile % 8) * 16 + 3},${Math.floor(stoneTile / 8) * 16 + 5}`)).toBe(NQ.sand);
  const pixel = (tile: number, x: number, y: number) =>
    pixels.get(`${(tile % 8) * 16 + x},${Math.floor(tile / 8) * 16 + y}`);
  expect(pixel(TOWN_SHOP_START + 15, 4, 5)).toBe(NQ.sand);
  expect(pixel(TOWN_FARM_TILE, 1, 13)).toBe(NQ.tan);
  expect(roofPixel(5, 3, 2)).toBe(NQ.brick);
  expect(roofPixel(0, 4, 5)).toBe(NQ.brick);
  expect(roofPixel(1, 4, 5)).toBe(NQ.blue);
  expect(roofPixel(0, 0, 2, 0)).toBe(NQ.lime);
  expect(roofPixel(0, 15, 2, 0)).toBe(NQ.lime);
  expect(roofPixel(0, 8, 12, 11)).not.toBe(roofPixel(0, 8, 12, 15));
  expect(roofPixel(0, 8, 1, 14)).toBe(NQ.apricot);
  expect(roofPixel(6, 2, 9)).toBe(NQ.cloud);
  expect(roofPixel(6, 8, 15, 11)).toBe(NQ.brown);
  expect(roofPixel(6, 8, 0, 14, 1)).toBe(NQ.silver);
  expect(roofPixel(6, 15, 5, 13, 1)).toBe(NQ.gray);
  expect(roofPixel(6, 8, 0, 15, 1)).toBe(NQ.white);
  expect(roofPixel(6, 15, 5, 15, 1)).toBe(NQ.white);
  expect(roofPixel(6, 0, 2, 0, 1)).toBe(NQ.white);
  expect(roofPixel(7, 2, 3)).toBe(NQ.brown);
});
