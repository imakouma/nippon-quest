import { describe, expect, it } from 'vitest';
import { partyFromGameState } from '../../src/core/battle/setup';
import {
  SPECIALTY_AREA_BONUS_RATE,
  specialtyTreasureBonus,
  specialtyTreasureGain,
} from '../../src/core/progression/specialty';
import { motifStamp } from '../../src/core/progression/route';
import { createNewGame } from '../../src/core/state/newGame';
import { content } from './helpers';

const fresh = () => createNewGame({ name: 'テスト', grade: 3 }, 1000);

describe('特産品の お宝ボーナス', () => {
  it('県の特産品を集めた割合だけ、永久ボーナスが育つ', async () => {
    const c = await content();
    const gs = fresh();
    const aomori = c.areas.get('aomori')!;
    const specialties = aomori.motifs.filter((motif) => motif.kind === 'food' || motif.kind === 'craft');

    gs.dex.motifs.push(motifStamp('aomori', specialties[0]!.id));
    const one = specialtyTreasureBonus(gs, c.areas, c.items);
    expect(one.found).toBe(1);
    expect(one.total).toBeGreaterThan(1);
    expect(one.byArea.get('aomori')).toMatchObject({ found: 1, total: specialties.length });
    expect(one.rate).toBeCloseTo(SPECIALTY_AREA_BONUS_RATE / specialties.length);

    gs.dex.motifs = specialties.map((motif) => motifStamp('aomori', motif.id));
    const complete = specialtyTreasureBonus(gs, c.areas, c.items);
    expect(complete.rate).toBeCloseTo(SPECIALTY_AREA_BONUS_RATE);
    expect(complete.completedAreas).toBe(1);
  });

  it('持ち物を使い切っても図鑑登録があれば効果は消えず、戦闘能力に反映される', async () => {
    const c = await content();
    const gs = fresh();
    const base = partyFromGameState(gs, c).hero.stats;

    gs.dex.items.push('aomori-ringo');
    gs.inventory['aomori-ringo'] = 0;
    const powered = partyFromGameState(gs, c).hero.stats;

    expect(powered.hp).toBeGreaterThan(base.hp);
    expect(powered.atk).toBeGreaterThan(base.atk);
    expect(powered.def).toBeGreaterThan(base.def);
    expect(specialtyTreasureBonus(gs, c.areas, c.items).found).toBe(1);
  });

  it('同じ特産品を何個持っていても重複して強くならない', async () => {
    const c = await content();
    const one = fresh();
    one.dex.items.push('aomori-ringo');
    one.inventory['aomori-ringo'] = 1;
    const many = structuredClone(one);
    many.inventory['aomori-ringo'] = 99;

    expect(specialtyTreasureBonus(one, c.areas, c.items).rate).toBe(
      specialtyTreasureBonus(many, c.areas, c.items).rate,
    );
  });

  it('初めて手に入れる特産品だけ、今回増える永久ボーナスを返す', async () => {
    const c = await content();
    const gs = fresh();
    const gain = specialtyTreasureGain(gs, 'aomori-ringo', c.areas, c.items);

    expect(gain).toMatchObject({ areaId: 'aomori', found: 1, complete: false });
    expect(gain!.gainRate).toBeCloseTo(SPECIALTY_AREA_BONUS_RATE / gain!.total);
    expect(gain!.totalRate).toBeCloseTo(gain!.gainRate);

    gs.dex.items.push('aomori-ringo');
    expect(specialtyTreasureGain(gs, 'aomori-ringo', c.areas, c.items)).toBeNull();
  });

  it('県の最後の特産品ならコンプリートを返す', async () => {
    const c = await content();
    const gs = fresh();
    const aomori = c.areas.get('aomori')!;
    const itemIds = aomori.motifs
      .filter((motif) => motif.kind === 'food' || motif.kind === 'craft')
      .map((motif) => `aomori-${motif.id}`)
      .filter((id) => c.items.has(id));
    gs.dex.items.push(...itemIds.slice(0, -1));

    expect(specialtyTreasureGain(gs, itemIds.at(-1)!, c.areas, c.items)).toMatchObject({
      found: itemIds.length,
      total: itemIds.length,
      complete: true,
    });
  });
});
