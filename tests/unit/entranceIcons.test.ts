import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildEntranceIcons,
  entranceIconScale,
  INTER_PREFECTURE_ICON_SIZE,
  interPrefectureIconKey,
} from '../../src/rendering/overworld/entranceIcons';
import { NQ, NQ48 } from '../../src/rendering/palette';

afterEach(() => vi.unstubAllGlobals());

describe('フィールド入口の大きさ', () => {
  it('すべての町を2×2マス相当で表示する', () => {
    expect(entranceIconScale('aomori-town')).toBe(2);
    expect(entranceIconScale('iwate-town')).toBe(2);
  });

  it('町以外は1マスのままにし、明示値は優先する', () => {
    expect(entranceIconScale('aomori-dungeon')).toBe(1);
    expect(entranceIconScale('iwate-town', 3)).toBe(3);
  });
});

describe('県境・実在交通のフィールド入口', () => {
  it.each([
    ['県境門', { infrastructure: 'landBorder', travelMode: 'walk' }, 'gate'],
    ['橋', { infrastructure: 'bridge', travelMode: 'bicycle' }, 'bridge'],
    ['トンネル', { infrastructure: 'tunnel', travelMode: 'walk' }, 'tunnel'],
    ['鉄道', { infrastructure: 'tunnel', travelMode: 'rail' }, 'rail'],
    ['橋を渡る鉄道', { infrastructure: 'bridge', travelMode: 'rail' }, 'rail'],
    ['フェリー', { infrastructure: 'seaRoute', travelMode: 'ferry' }, 'ferry'],
  ] as const)('%s を種類と開閉状態が分かるテクスチャキーにする', (_label, link, kind) => {
    expect(interPrefectureIconKey(link, true)).toBe(`fld.interpref.${kind}.open`);
    expect(interPrefectureIconKey(link, false)).toBe(`fld.interpref.${kind}.closed`);
  });

  it('5種類×開閉の10キーは重複せず、すべて1マスの16pxで描く', () => {
    const links = [
      { infrastructure: 'landBorder', travelMode: 'walk' },
      { infrastructure: 'bridge', travelMode: 'bicycle' },
      { infrastructure: 'tunnel', travelMode: 'walk' },
      { infrastructure: 'tunnel', travelMode: 'rail' },
      { infrastructure: 'seaRoute', travelMode: 'ferry' },
    ] as const;
    const keys = links.flatMap((link) => [
      interPrefectureIconKey(link, true),
      interPrefectureIconKey(link, false),
    ]);

    expect(new Set(keys).size).toBe(10);
    expect(INTER_PREFECTURE_ICON_SIZE).toBe(16);
  });

  it('10テクスチャをNQ paletteだけで登録し、閉鎖時は赤い遮断バーを重ねる', () => {
    interface FakeCanvas {
      width: number;
      height: number;
      getContext(): { fillStyle: string; fillRect(): void };
    }
    const draws = new WeakMap<FakeCanvas, string[]>();
    const registered = new Map<string, { width: number; height: number; colors: string[] }>();
    vi.stubGlobal('document', {
      createElement: () => {
        const colors: string[] = [];
        const context = {
          fillStyle: '',
          fillRect: () => colors.push(context.fillStyle),
        };
        const canvas: FakeCanvas = { width: 0, height: 0, getContext: () => context };
        draws.set(canvas, colors);
        return canvas;
      },
    });
    const textures = {
      exists: () => false,
      addCanvas: (key: string, canvas: FakeCanvas) => {
        registered.set(key, {
          width: canvas.width,
          height: canvas.height,
          colors: [...(draws.get(canvas) ?? [])],
        });
      },
    };

    buildEntranceIcons({ textures } as never);

    const entries = [...registered].filter(([key]) => key.startsWith('fld.interpref.'));
    expect(entries).toHaveLength(10);
    for (const [key, texture] of entries) {
      expect([texture.width, texture.height], key).toEqual([16, 16]);
      expect(
        texture.colors.every((color) => NQ48.includes(color)),
        key,
      ).toBe(true);
      if (key.endsWith('.closed'))
        expect(texture.colors, key).toEqual(expect.arrayContaining([NQ.red, NQ.cream]));
      else expect(texture.colors, key).toEqual(expect.arrayContaining([NQ.green, NQ.lime]));
    }
  });
});
