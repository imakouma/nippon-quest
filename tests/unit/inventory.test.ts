import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { partyFromGameState } from '../../src/core/battle/setup';
import { canUse, equipItem, unequip, useItem } from '../../src/core/progression/inventory';
import { createNewGame } from '../../src/core/state/newGame';

const fresh = () => createNewGame({ name: 'テスト', grade: 3, starterMonsterId: 'aomori-nebutan' }, 1000);

describe('バッグ・そうび', () => {
  it('りんごは HP が へっているときだけ つかえて、1 つ へる', async () => {
    const c = await content();
    const herb = c.items.get('aomori-ringo')!;
    const gs = fresh();
    gs.inventory['aomori-ringo'] = 3;
    expect(canUse(gs, herb, { hp: 40, mp: 10 })).toBe(false);
    const hurt = { ...gs, player: { ...gs.player, hp: 25 } };
    const r = useItem(hurt, herb, { hp: 40, mp: 10 })!;
    expect(r.state.player.hp).toBe(40);
    expect(r.healed).toBe(15);
    expect(r.state.inventory['aomori-ringo']).toBe(2);
  });

  it('そうびすると ステータスが あがり、前の そうびは バッグに もどる', async () => {
    const c = await content();
    const sword = c.items.get('common-dou-no-ken')!;
    let gs = fresh();
    gs.inventory[sword.id] = 1;
    const before = partyFromGameState(gs, c).hero.stats.atk;
    gs = equipItem(gs, sword)!;
    expect(gs.player.equipment.weapon).toBe(sword.id);
    expect(gs.inventory[sword.id]).toBe(0);
    expect(partyFromGameState(gs, c).hero.stats.atk).toBeGreaterThan(before);
    expect(equipItem(gs, sword)).toBeNull(); // もう バッグに ない
    const off = unequip(gs, 'weapon')!;
    expect(off.player.equipment.weapon).toBeUndefined();
    expect(off.inventory[sword.id]).toBe(1);
  });

  it('そうびでない どうぐは そうびできない', async () => {
    const c = await content();
    const gs = fresh();
    gs.inventory['aomori-ringo'] = 1;
    expect(equipItem(gs, c.items.get('aomori-ringo')!)).toBeNull();
    expect(unequip(gs, 'head')).toBeNull();
  });
});
