import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { giveHat, hatsEarned, isHat, wearHat } from '../../src/core/progression/hats';
import { motifStamp } from '../../src/core/progression/route';
import { createNewGame } from '../../src/core/state/newGame';
import { gameStateSchema } from '../../src/core/state/schema';
import { HAT_ART, heroKey, heroLook } from '../../src/scenes/art/characters';

const fresh = () => createNewGame({ name: 'テスト', grade: 3, starterMonsterId: 'aomori-nebutan' }, 1000);
const MELON = 'hokkaido-melon-kaburimono';

/** にほんちずの ★（public/worldmap.json と 同じ 数え方） */
const world = JSON.parse(readFileSync(new URL('../../public/worldmap.json', import.meta.url), 'utf8')) as {
  regions: { areas: { id: string; stamps: string[] }[] }[];
};
const stampsOf = (id: string) => world.regions.flatMap((r) => r.areas).find((a) => a.id === id)?.stamps ?? [];

describe('かぶりもの', () => {
  it('かぶりものは だいじな もので、県の しるし（areaOrigin）と 絵（HAT_ART）が ある', async () => {
    const c = await content();
    const hats = [...c.items.values()].filter(isHat);
    expect(hats.map((h) => h.id)).toContain(MELON);
    for (const h of hats) {
      expect(h.areaOrigin && c.areas.has(h.areaOrigin), h.id).toBe(true);
      expect(HAT_ART[h.id], h.id).toBeDefined();
    }
  });

  it('北海道の ★ が ぜんぶ そろうと メロンの かぶりものが もらえる（1 つ 足りないと もらえない）', async () => {
    const c = await content();
    const stamps = stampsOf('hokkaido');
    expect(stamps.length).toBeGreaterThan(0);
    const gs = fresh();
    gs.dex.motifs = stamps.slice(1).map((m) => motifStamp('hokkaido', m));
    expect(hatsEarned(gs, c.items.values(), stampsOf)).toEqual([]);
    gs.dex.motifs.push(motifStamp('hokkaido', stamps[0]!));
    const earned = hatsEarned(gs, c.items.values(), stampsOf);
    expect(earned.map((h) => h.id)).toEqual([MELON]);

    const got = giveHat(gs, earned[0]!);
    expect(got.inventory[MELON]).toBe(1);
    expect(got.dex.items).toContain(MELON);
    // もう もっているので 2 回は もらえない
    expect(hatsEarned(got, c.items.values(), stampsOf)).toEqual([]);
  });

  it('もっている かぶりものだけ かぶれて、ぬぐと いつもの ぼうしに もどる', async () => {
    const c = await content();
    const gs = fresh();
    expect(wearHat(gs, MELON)).toBeNull();
    const got = giveHat(gs, c.items.get(MELON)!);
    const worn = wearHat(got, MELON)!;
    expect(worn.player.appearance.hat).toBe(MELON);
    expect(wearHat(worn, MELON)).toBeNull();
    expect(wearHat(worn, null)!.player.appearance.hat).toBeNull();
  });

  it('前の セーブ（hat が 無い）も そのまま よめる', () => {
    const gs = fresh();
    const { hat: _hat, ...old } = gs.player.appearance;
    const parsed = gameStateSchema.parse({ ...gs, player: { ...gs.player, appearance: old } });
    expect(parsed.player.appearance.hat).toBeNull();
  });

  it('かぶると 絵の キーが かわり、ぼうしの かわりに かぶりものを 描く', () => {
    const base = { hair: 0, skin: 0, cloth: 0 };
    expect(heroKey({ ...base, hat: MELON })).not.toBe(heroKey(base));
    expect(heroKey({ ...base, hat: null })).toBe(heroKey(base));
    expect(heroLook({ ...base, hat: MELON }).hat).toBe(HAT_ART[MELON]);
    expect(heroLook(base).hat).toBeNull();
  });
});
