import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { partyFromGameState } from '../../src/core/battle/setup';
import { equipItem } from '../../src/core/progression/inventory';
import { giveMeisan, isMeisanGear, meisanEarned } from '../../src/core/progression/meisan';
import { motifStamp } from '../../src/core/progression/route';
import { createNewGame } from '../../src/core/state/newGame';
import { battleFrames, heroCostumeIds, heroKey, heroLook, walkFrames } from '../../src/rendering/characters';
import { COSTUME_ART, HERO_FRAME } from '../../src/rendering/costumes';
import { NQ48 } from '../../src/rendering/palette';

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
    // 47 都道府県 1 つずつ
    expect(new Set(gear.map((g) => g.areaOrigin)).size).toBe(47);
    expect(gear).toHaveLength(47);
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
    expect(giveMeisan(got, earned[0]!)).toBe(got);
    expect(giveMeisan(got, c.items.get('aomori-ringo')!)).toBe(got);
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

describe('めいさんひんの そうびの 絵', () => {
  const ap = { hair: 0, skin: 0, cloth: 0 };
  const palette = new Set<string>(NQ48);
  const plain = [...walkFrames(heroLook(ap), true), ...battleFrames(heroLook(ap))];
  for (const id of Object.keys(COSTUME_ART)) {
    it(`${id}：色は NQ-48 だけ・着ると 絵が かわる・いつもの 絵から はみ出さない 大きさ`, () => {
      const eq = { [COSTUME_ART[id]!.slot]: id };
      const worn = [...walkFrames(heroLook(ap, eq), true), ...battleFrames(heroLook(ap, eq))];
      for (const f of worn) {
        expect(f).toHaveLength(HERO_FRAME.h);
        expect(f.every((row) => row.length === HERO_FRAME.w)).toBe(true);
        expect([
          ...new Set(f.flat().filter((color): color is string => !!color && !palette.has(color))),
        ]).toEqual([]);
      }
      // どの コマも いつもの 絵と ちがう（見て わかるほど：10 ドット いじょう）
      worn.forEach((f, k) => {
        let diff = 0;
        f.forEach((row, y) => row.forEach((c, x) => c !== plain[k]![y]![x] && diff++));
        expect(diff, `コマ ${k}`).toBeGreaterThanOrEqual(10);
      });
    });
  }
});
