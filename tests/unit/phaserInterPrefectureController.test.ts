import { describe, expect, it, vi } from 'vitest';
import { PhaserInterPrefectureController } from '../../src/scenes/overworld/phaserInterPrefectureController';

describe('PhaserInterPrefectureController', () => {
  it('登録した県境リンクをマップ切替時に破棄する', () => {
    const image = { setDepth: vi.fn().mockReturnThis(), setTexture: vi.fn() };
    const host = {
      add: { image: vi.fn(() => image) },
      busy: false,
      areaId: () => 'aomori',
      content: () => undefined,
      gs: () => undefined,
      devAll: () => false,
      standStill: vi.fn(),
      root: vi.fn(),
      talk: vi.fn(),
      switchMap: vi.fn(),
    };
    const controller = new PhaserInterPrefectureController(host as never);
    controller.register(
      {
        type: 'interPrefectureLink',
        properties: [
          { name: 'linkId', value: 'aomori-iwate' },
          { name: 'targetArea', value: 'iwate' },
          { name: 'targetMap', value: 'iwate-field' },
          { name: 'targetSpawn', value: 'from_aomori-iwate' },
          { name: 'firstTargetSpawn', value: 'spawn' },
          { name: 'infrastructure', value: 'landBorder' },
          { name: 'travelMode', value: 'walk' },
        ],
      },
      2,
      3,
      10,
      16,
    );

    expect(controller.at(32)?.targetArea).toBe('iwate');
    controller.reset();
    expect(controller.at(32)).toBeUndefined();
  });
});
