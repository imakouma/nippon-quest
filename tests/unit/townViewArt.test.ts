import { afterEach, expect, it, vi } from 'vitest';
import { NQ, NQ48 } from '../../src/rendering/palette';
import { TOWN_GROUND_COUNT, TOWN_ROOFS, TOWN_ROOF_START } from '../../src/rendering/overworld/townView';
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
  const scene = { textures: { exists: () => false, addCanvas: () => undefined } };
  buildTownViewTexture(scene as unknown as Parameters<typeof buildTownViewTexture>[0]);

  for (
    let tile = TOWN_ROOF_START;
    tile < TOWN_ROOF_START + TOWN_GROUND_COUNT * TOWN_ROOFS.length * 16;
    tile++
  ) {
    const originX = (tile % 8) * 16;
    const originY = Math.floor(tile / 8) * 16;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) expect(NQ48).toContain(pixels.get(`${originX + x},${originY + y}`));
  }
  const roofPixel = (roof: number, x: number, y: number, mask = 15) => {
    const tile = TOWN_ROOF_START + roof * 16 + mask;
    return pixels.get(`${(tile % 8) * 16 + x},${Math.floor(tile / 8) * 16 + y}`);
  };
  const stoneTile = 15;
  expect(pixels.get(`${(stoneTile % 8) * 16 + 3},${Math.floor(stoneTile / 8) * 16 + 5}`)).toBe(NQ.sand);
  expect(roofPixel(5, 3, 2)).toBe(NQ.brick);
  expect(roofPixel(0, 4, 5)).toBe(NQ.brick);
  expect(roofPixel(1, 4, 5)).toBe(NQ.blue);
  expect(roofPixel(6, 2, 9)).toBe(NQ.cloud);
  expect(roofPixel(6, 8, 15, 11)).toBe(NQ.brown);
  expect(roofPixel(7, 2, 3)).toBe(NQ.brown);
});
