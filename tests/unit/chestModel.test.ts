import { describe, expect, it } from 'vitest';
import { chestModel, specialtyChestModel } from '../../src/scenes/overworld/chestModel';
import { createNewGame } from '../../src/core/state/newGame';
import { content } from './helpers';

describe('宝箱表示モデル', () => {
  it('通常宝箱は content のアイテム名とセーブ済みの開封状態を使う', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 3, starterMonsterId: 'aomori-nebutan' }, 1);
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

  it('特産品宝箱は図鑑スタンプを開封状態として使う', async () => {
    const c = await content();
    const area = c.areas.get('aomori')!;
    const game = createNewGame({ name: 'ハル', grade: 3, starterMonsterId: 'aomori-nebutan' }, 1);
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
});
