import { beforeAll, describe, expect, it } from 'vitest';
import type { ContentIndex } from '../../src/core/content/loader';
import {
  acceptMission,
  buyItem,
  canCraft,
  claimDexReward,
  completeMission,
  craft,
  dexProgress,
  innRest,
  knownRecipes,
  missionStatus,
  missionsFor,
  shopStock,
  villagerGift,
} from '../../src/core/progression/town';
import { createNewGame } from '../../src/core/state/newGame';
import type { GameState } from '../../src/core/state/schema';
import { content } from './helpers';

let c: ContentIndex;
let gs: GameState;
const titles = {
  defeat: (m: string, n: number) => `${m}×${n}`,
  collect: (i: string, n: number) => `${i}×${n}`,
};

beforeAll(async () => {
  c = await content();
});

const fresh = (): GameState =>
  createNewGame({ name: 'テスト', grade: 3, starterMonsterId: 'aomori-nebutan' }, 1000);

describe('おみせ・やどや・かじや', () => {
  it('青森の おみせは content の品ぞろえ、無い県は その県の どうぐ', () => {
    expect(shopStock(c.areas.get('aomori')!, c.items).map((s) => s.itemId)).toContain('aomori-ringo');
    const akita = shopStock(c.areas.get('akita')!, c.items);
    expect(akita.length).toBeGreaterThan(0);
    expect(akita.every((s) => s.itemId.startsWith('akita-'))).toBe(true);
    expect(akita.every((s) => s.price > 0)).toBe(true);
  });

  it('かうと おかねが へって どうぐが ふえる。たりなければ かえない', () => {
    gs = fresh();
    const next = buyItem(gs, { itemId: 'aomori-ringo', price: 15 }, 2)!;
    expect(next.player.gold).toBe(gs.player.gold - 30);
    expect(next.inventory['aomori-ringo']).toBe(2);
    expect(
      buyItem({ ...gs, player: { ...gs.player, gold: 5 } }, { itemId: 'aomori-ringo', price: 15 }),
    ).toBeNull();
  });

  it('やどやは HP ぜんかい＋もどり先。おかねが無くても とまれる', () => {
    gs = fresh();
    const hurt = { ...gs, player: { ...gs.player, hp: 3, mp: 0, gold: 0 } };
    const r = innRest(hurt, { hp: 40, mp: 10 }, { map: 'aomori-town', x: 10, y: 20 });
    expect(r.paid).toBe(0);
    expect(r.state.player.hp).toBe(40);
    expect(r.state.progress.lastInn).toEqual({ map: 'aomori-town', x: 10, y: 20 });
  });

  it('かじやは ざいりょうが そろうと つくれる', () => {
    gs = fresh();
    const rc = knownRecipes(c.recipes.values(), gs).find((r) => r.id === 'rc-nebuta-no-kabuto')!;
    expect(canCraft(gs, rc)).toBe(false);
    const rich = structuredClone(gs);
    for (const m of rc.materials) rich.inventory[m.itemId] = m.n;
    const next = craft(rich, rc)!;
    expect(next.inventory[rc.result.itemId]).toBe(rc.result.n);
    expect(rc.materials.every((m) => next.inventory[m.itemId] === 0)).toBe(true);
  });
});

describe('けいじばん', () => {
  it('たのみごとの無い県にも 自動で用意される', () => {
    const ms = missionsFor(c.areas.get('akita')!, c.monsters, c.items, titles);
    expect(ms.length).toBeGreaterThanOrEqual(2);
    expect(
      ms.every((m) => c.monsters.has(m.condition.split(':')[1]!) || c.items.has(m.condition.split(':')[1]!)),
    ).toBe(true);
  });

  it('たおす たのみごとは うけてから かぞえる → ほうこくで ごほうび', () => {
    gs = fresh();
    const m = missionsFor(c.areas.get('aomori')!, c.monsters, c.items, titles).find((x) =>
      x.condition.startsWith('defeat:'),
    )!;
    const [, target, n] = m.condition.split(':');
    gs.progress.counters[`defeat:${target}`] = 10; // うける前に たおした分は かぞえない
    expect(missionStatus(gs, m)).toBe('new');
    let s = acceptMission(gs, m);
    expect(missionStatus(s, m)).toBe('accepted');
    s.progress.counters[`defeat:${target}`] = 10 + Number(n);
    expect(missionStatus(s, m)).toBe('ready');
    const done = completeMission(s, m)!;
    expect(missionStatus(done.state, m)).toBe('done');
    expect(done.lines.length).toBeGreaterThan(0);
    s = done.state;
    expect(completeMission(s, m)).toBeNull();
  });
});

describe('まちの ひと・ずかんがかり', () => {
  it('町の人の おみやげは その人が はなす モチーフで かわり、どうぐは content にある', () => {
    for (const area of c.areas.values()) {
      for (const k of [1, 2, 3, 4]) {
        const r = villagerGift(area, `npc_talk_${k}`, c.items);
        expect(Object.keys(r).length).toBeGreaterThan(0);
        for (const it of r.items ?? []) expect(c.items.has(it.itemId)).toBe(true);
      }
    }
  });

  it('めいしょを 3 こ 見つけるごとに 1 だん。もらうのは 1 回だけ', () => {
    const area = c.areas.get('aomori')!;
    gs = fresh();
    gs.dex.motifs = area.motifs.slice(0, 3).map((m) => `aomori.${m.id}`);
    expect(dexProgress(gs, area).tiers).toBe(1);
    const got = claimDexReward(gs, area)!;
    expect(got.state.player.gold).toBe(gs.player.gold + 30);
    expect(claimDexReward(got.state, area)).toBeNull();
  });
});
