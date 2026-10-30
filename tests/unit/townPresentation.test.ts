import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: { Scenes: { Events: { SHUTDOWN: 'shutdown' } } } }));
vi.mock('../../src/rendering/overworld/townTreeArt', () => ({ buildTownTreeTexture: vi.fn() }));
vi.mock('../../src/rendering/overworld/townViewArt', () => ({
  buildTownViewTexture: vi.fn(),
  TOWN_VIEW_TEXTURE: 'town-view',
}));

import { TOWN_FARM_TILE } from '../../src/rendering/overworld/townView';
import { addTownDecor, addTownViewLayer } from '../../src/scenes/overworld/townPresentation';

describe('町の decor 表示', () => {
  it('背景とdecorを読み取り果樹の地面だけを表示写像に渡す', () => {
    const putTilesAt = vi.fn();
    const copy = { addTilesetImage: () => ({}), createBlankLayer: () => ({ putTilesAt }), destroy: vi.fn() };
    const scene = { make: { tilemap: () => copy }, events: { once: vi.fn() } };
    const layers = { background: { data: [[{ index: 1 }]] }, decor: { data: [[{ index: 31 }]] } };
    const map = { width: 1, height: 1, getLayer: (name: keyof typeof layers) => layers[name] };
    addTownViewLayer(scene as never, map as never, 16);
    expect(putTilesAt).toHaveBeenCalledWith([[TOWN_FARM_TILE]], 0, 0);
    expect(layers.background.data[0]![0]!.index).toBe(1);
    expect(layers.decor.data[0]![0]!.index).toBe(31);
  });

  it('コピーから木だけを除外し、接地点・depth・破棄を保つ', () => {
    const data = [[{ index: 32 }, { index: 34 }]];
    const original = structuredClone(data);
    const putTilesAt = vi.fn();
    const copy = {
      addTilesetImage: vi.fn(() => ({})),
      createBlankLayer: vi.fn(() => ({ putTilesAt })),
      destroy: vi.fn(),
    };
    const image = { setOrigin: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
    image.setOrigin.mockReturnValue(image);
    image.setDepth.mockReturnValue(image);
    const shadow = { setDepth: vi.fn(), fillStyle: vi.fn(), fillEllipse: vi.fn(), destroy: vi.fn() };
    shadow.setDepth.mockReturnValue(shadow);
    shadow.fillStyle.mockReturnValue(shadow);
    const once = vi.fn();
    const addImage = vi.fn(() => image);
    const scene = {
      make: { tilemap: () => copy },
      add: { graphics: () => shadow, image: addImage },
      events: { once },
    };
    const map = { width: 2, height: 1, getLayer: () => ({ data }) };

    expect(addTownDecor(scene as never, map as never, 16)).toBe(true);
    expect(data).toEqual(original);
    expect(putTilesAt).toHaveBeenCalledWith([[-1, 34]], 0, 0);
    expect(addImage).toHaveBeenCalledWith(8, 15, 'town-tree-round');
    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 1);
    expect(image.setDepth).toHaveBeenCalledWith(8);
    expect(shadow.fillEllipse).toHaveBeenCalledWith(8, 15, 8, 2);
    expect(once).toHaveBeenCalledWith('shutdown', expect.any(Function));
    once.mock.calls[0]![1]();
    expect(copy.destroy).toHaveBeenCalledOnce();
    expect(shadow.destroy).toHaveBeenCalledOnce();
    expect(image.destroy).toHaveBeenCalledOnce();
  });

  it('表示コピーを作れない場合は元decorへ戻す', () => {
    const copy = { addTilesetImage: () => null, createBlankLayer: vi.fn(), destroy: vi.fn() };
    const scene = { make: { tilemap: () => copy } };
    const map = { width: 1, height: 1, getLayer: () => ({ data: [[{ index: 32 }]] }) };
    expect(addTownDecor(scene as never, map as never, 16)).toBe(false);
    expect(copy.destroy).toHaveBeenCalledOnce();
  });

  it('対象の木がない場合はコピーや描画物を作らず元decorへ戻す', () => {
    const tilemap = vi.fn();
    const scene = { make: { tilemap } };
    const map = { width: 2, height: 1, getLayer: () => ({ data: [[{ index: 31 }, { index: 34 }]] }) };
    expect(addTownDecor(scene as never, map as never, 16)).toBe(false);
    expect(tilemap).not.toHaveBeenCalled();
  });
});
