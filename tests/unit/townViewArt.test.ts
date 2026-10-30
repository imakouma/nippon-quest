import { afterEach, expect, it, vi } from 'vitest';
import { NQ48 } from '../../src/rendering/palette';
import { TOWN_ROOFS, TOWN_ROOF_START } from '../../src/rendering/overworld/townView';
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

  for (let tile = TOWN_ROOF_START; tile < TOWN_ROOF_START + 3 * TOWN_ROOFS.length * 16; tile++) {
    const originX = (tile % 8) * 16;
    const originY = Math.floor(tile / 8) * 16;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) expect(NQ48).toContain(pixels.get(`${originX + x},${originY + y}`));
  }
});
