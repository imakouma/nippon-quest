import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { setAssetCatalog } from '../../src/rendering/assetCatalog';
import { preloadMonsterImages } from '../../src/scenes/battle/preloadMonsterImages';

describe('戦闘の完成モンスター画像', () => {
  beforeEach(() => setAssetCatalog({ files: ['sprites/monsters/iwate-kagurabi.png'] }, '/game'));

  function scene(cached = false) {
    const load = vi.fn();
    const values: Record<string, unknown> = {
      content: {
        monsters: new Map([
          ['iwate-kagurabi', { spriteKey: 'mon.iwate-kagurabi' }],
          ['aomori-ringoron', { spriteKey: 'mon.aomori-ringoron' }],
        ]),
      },
      game: { party: { owned: [{ monsterId: 'iwate-kagurabi' }] } },
    };
    const stub = {
      registry: { get: (key: string) => values[key] },
      textures: { exists: () => cached },
      load: { image: load },
    };
    return { stub: stub as unknown as Phaser.Scene, load };
  }

  it('仲間と敵で同じIDがあっても完成PNGは1回だけ読み込む', () => {
    const { stub, load } = scene();
    preloadMonsterImages(stub, 'iwate-kagurabi');
    expect(load.mock.calls).toEqual([
      ['mon.iwate-kagurabi', '/game/assets/sprites/monsters/iwate-kagurabi.png'],
    ]);
  });

  it('完成画像がない敵は仮絵のまま、完成画像のある仲間だけ読み込む', () => {
    const { stub, load } = scene();
    preloadMonsterImages(stub, 'aomori-ringoron');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('読み込み済みの画像を再リクエストしない', () => {
    const { stub, load } = scene(true);
    preloadMonsterImages(stub, 'iwate-kagurabi');
    expect(load).not.toHaveBeenCalled();
  });
});
