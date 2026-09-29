import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { partyFromGameState } from '../../src/core/battle/setup';
import { equipItem } from '../../src/core/progression/inventory';
import { giveMeisan, isMeisanGear, meisanEarned } from '../../src/core/progression/meisan';
import { motifStamp } from '../../src/core/progression/route';
import { createNewGame } from '../../src/core/state/newGame';
import { heroCostumeIds, heroKey, heroLook } from '../../src/scenes/art/characters';
import { COSTUME_ART } from '../../src/scenes/art/costumes';

const fresh = () => createNewGame({ name: 'テスト', grade: 3, starterMonsterId: 'aomori-nebutan' }, 1000);
const MELON = 'hokkaido-meisan-yubari-melon';

/** にほんちずの ★（public/worldmap.json と 同じ 数え方） */
const world = JSON.parse(readFileSync(new URL('../../public/worldmap.json', import.meta.url), 'utf8')) as {
  regions: { areas: { id: string; stamps: string[] }[] }[];
};
const stampsOf = (id: string) => world.regions.flatMap((r) => r.areas).find((a) => a.id === id)?.stamps ?? [];
const allStamps = (id: string) => stampsOf(id).map((m) => motifStamp(id, m));

describe('めいさんひんの そうび', () => {
  it('県ごとの そうびで、強さ（stats）と 着たときの 絵（COSTUME_ART）が ある', async () => {
    const c = await content();
    const gear = [...c.items.values()].filter(isMeisanGear);
    expect(gear.map((g) => g.id).sort()).toEqual(
      [MELON, 'aomori-meisan-ringo', 'akita-meisan-magewappa', 'iwate-meisan-nanbu-tekki'].sort(),
    );
    for (const g of gear) {
      expect(c.areas.has(g.areaOrigin!), g.id).toBe(true);
      expect(g.id.startsWith(`${g.areaOrigin}-meisan-`), g.id).toBe(true);
      expect(Object.keys(g.stats ?? {}).length, g.id).toBeGreaterThan(0);
      expect(COSTUME_ART[g.id]?.slot, g.id).toBe(g.kind);
    }
    // 絵だけ あって どうぐが 無い ものも ない
    for (const id of Object.keys(COSTUME_ART)) expect(c.items.has(id), id).toBe(true);
  });

  it('県の ★ が ぜんぶ そろうと もらえる（1 つ 足りないと もらえない・2 回は もらえない）', async () => {
    const c = await content();
    const gs = fresh();
    gs.dex.motifs = allStamps('hokkaido').slice(1);
    expect(meisanEarned(gs, c.items.values(), stampsOf)).toEqual([]);
    gs.dex.motifs = allStamps('hokkaido');
    const earned = meisanEarned(gs, c.items.values(), stampsOf);
    expect(earned.map((g) => g.id)).toEqual([MELON]);
    const got = giveMeisan(gs, earned[0]!);
    expect(got.inventory[MELON]).toBe(1);
    expect(got.dex.items).toContain(MELON);
    expect(meisanEarned(got, c.items.values(), stampsOf)).toEqual([]);
    // そうびして バッグの 外に 無くても、もう もっている
    const worn = equipItem(got, c.items.get(MELON)!)!;
    expect(meisanEarned(worn, c.items.values(), stampsOf)).toEqual([]);
  });

  it('頭・体・足・くつを いっしょに そうびでき、HP も ぼうぎょも あがる', async () => {
    const c = await content();
    let gs = fresh();
    const base = partyFromGameState(gs, c).hero.stats;
    const ids = [MELON, 'aomori-meisan-ringo', 'akita-meisan-magewappa', 'iwate-meisan-nanbu-tekki'];
    for (const id of ids) gs = equipItem(giveMeisan(gs, c.items.get(id)!), c.items.get(id)!)!;
    const up = partyFromGameState(gs, c).hero.stats;
    const sum = (k: 'hp' | 'def') => ids.reduce((a, id) => a + (c.items.get(id)!.stats?.[k] ?? 0), 0);
    expect(up.hp - base.hp).toBe(sum('hp'));
    expect(up.def - base.def).toBe(sum('def'));
    // 絵は 足 → くつ → 体 → 頭 の じゅんに かさねる
    expect(heroCostumeIds(gs.player.equipment)).toEqual([
      'akita-meisan-magewappa',
      'iwate-meisan-nanbu-tekki',
      'aomori-meisan-ringo',
      MELON,
    ]);
  });

  it('着ている そうびで 絵の キーが かわり、頭の そうびを かぶると ぼうしを ぬぐ', () => {
    const ap = { hair: 0, skin: 0, cloth: 0 };
    expect(heroKey(ap, { head: MELON })).not.toBe(heroKey(ap));
    // 絵の ない ふつうの そうびでは かわらない
    expect(heroKey(ap, { head: 'aomori-nebuta-no-kabuto' })).toBe(heroKey(ap));
    expect(heroLook(ap, { head: MELON }).cap).toBeNull();
    expect(heroLook(ap).cap).not.toBeNull();
  });
});
