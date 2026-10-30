import { beforeAll, describe, expect, it, vi } from 'vitest';
import { content } from './helpers';
import { equipSetProgress, type EquipSlot } from '../../src/core/progression/inventory';
import { createNewGame } from '../../src/core/state/newGame';
import { equippedBagThings } from '../../src/scenes/overworld/bagItems';
import { equipmentMenu } from '../../src/scenes/overworld/menuEntries';
import { setDictionary, t } from '../../src/ui/i18n';
import ja from '../../content/i18n/ja.json';

vi.mock('../../src/rendering/itemIcons', () => ({ itemIconUrl: () => '' }));

const fresh = () => createNewGame({ name: 'テスト', grade: 3 }, 1000);
const stats = {
  hp: 40,
  mp: 10,
  scienceAtk: 1,
  humanitiesAtk: 1,
  scienceDef: 1,
  humanitiesDef: 1,
  spd: 1,
  wis: 1,
};

describe('セット そうび', () => {
  beforeAll(() => setDictionary(ja));

  it('つけている部位の数を数え、5つでそろう', async () => {
    const set = (await content()).sets.get('set-aomori')!;
    const gs = fresh();
    expect(equipSetProgress(set, gs.player.equipment)).toEqual({ have: 0, total: 5, complete: false });
    gs.player.equipment.weapon = 'aomori-maguro-zutsuki';
    gs.player.equipment.head = 'aomori-nebuta-no-kabuto';
    expect(equipSetProgress(set, gs.player.equipment)).toEqual({ have: 2, total: 5, complete: false });
  });

  it('そうび画面にそろいぐあいを出し、そろうと効果の説明を出す', async () => {
    const c = await content();
    const set = c.sets.get('set-aomori')!;
    const gs = fresh();
    gs.player.equipment.weapon = 'aomori-maguro-zutsuki';
    const partial = equipmentMenu(c, gs, stats, () => '').entries.find(
      (entry) => entry.key === 'slot:weapon',
    )!;
    expect(partial.lines).toContain(t('field.equipSetProgress', { name: set.name, have: 1, total: 5 }));
    expect(partial.lines).not.toContain(set.bonus.description);

    for (const id of set.pieces) {
      const item = c.items.get(id)!;
      gs.player.equipment[item.kind as EquipSlot] = id;
    }
    const done = equipmentMenu(c, gs, stats, () => '').entries.find((entry) => entry.key === 'slot:head')!;
    expect(done.lines).toContain(t('field.equipSetDone', { name: set.name }));
    expect(done.lines).toContain(set.bonus.description);

    gs.progress.islandsCleared = ['tohoku'];
    const currentBagEntry = equippedBagThings(gs, c).find((entry) => entry.key === 'eq:head')!;
    expect(currentBagEntry.lines).toContain(t('field.equipSetDone', { name: set.name }));
    expect(currentBagEntry.lines).toContain(set.bonus.description);
  });
});
