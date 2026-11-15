import { afterEach, expect, it, vi } from 'vitest';
import { overworldTilesetCanvas } from '../../src/rendering/overworld/fieldArt';
import { NQ } from '../../src/rendering/palette';

afterEach(() => vi.unstubAllGlobals());

it('keeps eaves, plaster and the stone footing distinct without covering windows or doors', () => {
  const contexts: Map<string, string>[] = [];
  vi.stubGlobal('document', {
    createElement: () => {
      const pixels = new Map<string, string>();
      contexts.push(pixels);
      const context = {
        fillStyle: '',
        fillRect(x: number, y: number, width: number, height: number) {
          for (let py = y; py < y + height; py++)
            for (let px = x; px < x + width; px++) pixels.set(`${px},${py}`, this.fillStyle);
        },
        drawImage: () => undefined,
      };
      return { width: 0, height: 0, getContext: () => context };
    },
  });
  overworldTilesetCanvas();
  const pixel = (id: number, x: number, y: number) =>
    contexts[0]!.get(`${((id - 1) % 8) * 16 + x},${Math.floor((id - 1) / 8) * 16 + y}`);
  for (const id of [19, 20, 21]) {
    expect(pixel(id, 2, 0)).toBe(NQ.brown);
    expect(pixel(id, 2, 1)).toBe(NQ.tan);
    expect(pixel(id, 2, 5)).toBe(NQ.beige);
    expect(pixel(id, 2, 13)).toBe(NQ.cloud);
    expect(pixel(id, 2, 14)).toBe(NQ.silver);
    expect(pixel(id, 2, 15)).toBe(NQ.gray);
  }
  expect(pixel(20, 6, 6)).toBe(NQ.sky);
  expect(pixel(21, 9, 10)).toBe(NQ.gold);
  expect(pixel(21, 8, 15)).toBe(NQ.silver);
});
