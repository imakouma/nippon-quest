import { describe, expect, it } from 'vitest';
import { applyChestReward, chestModel, specialtyChestModel } from '../../src/scenes/overworld/chestModel';
import { createNewGame } from '../../src/core/state/newGame';
import { content } from './helpers';

describe('宝箱表示モデル', () => {
  it('通常宝箱のアイテムを所持品と図鑑へ記録する', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1);
    const chest = chestModel({
      mapKey: 'aomori-town',
      objectName: 'chest_1',
      itemId: 'common-tetsu',
      itemName: '鉄',
      count: 2,
      game,
      items: c.items,
      fallbackName: 'たからばこ',
    });

    const rewarded = applyChestReward(game, chest, c.items.get(chest.itemId), 10);

    expect(rewarded.inventory['common-tetsu']).toBe(2);
    expect(rewarded.dex.items).toContain('common-tetsu');
    expect(rewarded.progress.chestsOpened).toContain('aomori-town:chest_1');
    expect(rewarded.updatedAt).toBe(10);
  });

  it('通常宝箱は content のアイテム名とセーブ済みの開封状態を使う', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1);
    game.progress.chestsOpened.push('aomori-town:chest_1');
    const chest = chestModel({
      mapKey: 'aomori-town',
      objectName: 'chest_1',
      itemId: 'common-tetsu',
      itemName: '予備',
      count: 2,
      game,
      items: c.items,
      fallbackName: 'たからばこ',
    });
    expect(chest).toMatchObject({
      key: 'aomori-town:chest_1',
      itemId: 'common-tetsu',
      count: 2,
      opened: true,
    });
    expect(chest.itemName).toBe(c.items.get('common-tetsu')!.name);
  });

  it.each([-1, 0, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '2'])(
    '不正な宝箱個数 %s は安全な1個へ戻す',
    async (count) => {
      const c = await content();
      const chest = chestModel({
        mapKey: 'aomori-town',
        objectName: 'broken_chest',
        itemId: 'common-tetsu',
        itemName: '鉄',
        count,
        game: createNewGame({ name: 'ハル', grade: 3 }, 1),
        items: c.items,
        fallbackName: 'たからばこ',
      });

      expect(chest.count).toBe(1);
    },
  );

  it('特産品宝箱は図鑑スタンプを開封状態として使う', async () => {
    const c = await content();
    const area = c.areas.get('aomori')!;
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1);
    game.dex.motifs.push('aomori.ringo');
    const chest = specialtyChestModel({
      mapKey: 'aomori-field',
      objectName: 'box_ringo',
      motifId: 'ringo',
      area,
      game,
      items: c.items,
    });
    expect(chest).toMatchObject({
      itemId: 'aomori-ringo',
      opened: true,
      specialty: { stamp: 'aomori.ringo' },
    });
  });

  it('特産品宝箱はアイテム・スタンプ・開封履歴をまとめて記録する', async () => {
    const c = await content();
    const area = c.areas.get('aomori')!;
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1);
    const chest = specialtyChestModel({
      mapKey: 'aomori-field',
      objectName: 'box_ringo',
      motifId: 'ringo',
      area,
      game,
      items: c.items,
    })!;

    const rewarded = applyChestReward(game, chest, c.items.get(chest.itemId), 10);

    expect(rewarded.inventory['aomori-ringo']).toBe(1);
    expect(rewarded.dex.items).toContain('aomori-ringo');
    expect(rewarded.dex.motifs).toContain('aomori.ringo');
    expect(rewarded.progress.chestsOpened).toContain('aomori-field:box_ringo');
  });
});
