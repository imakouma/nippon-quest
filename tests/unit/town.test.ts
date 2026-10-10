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
  INN_PRICE,
  innRest,
  knownRecipes,
  missionStatus,
  missionsFor,
  sellItem,
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

const fresh = (): GameState => createNewGame({ name: 'テスト', grade: 3 }, 1000);

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

  it('0・負数・小数の購入数や不正価格で所持数とお金を壊さない', () => {
    gs = fresh();
    const entry = { itemId: 'aomori-ringo', price: 15 };
    expect(buyItem(gs, entry, 0)).toBeNull();
    expect(buyItem(gs, entry, -2)).toBeNull();
    expect(buyItem(gs, entry, 1.5)).toBeNull();
    expect(buyItem(gs, { ...entry, price: -15 }, 1)).toBeNull();
    expect(buyItem(gs, { ...entry, price: 1.5 }, 2)).toBeNull();
    expect(gs.inventory['aomori-ringo']).toBeUndefined();
  });

  it('購入後の所持数が安全整数を超える場合は購入しない', () => {
    gs = fresh();
    gs.inventory['aomori-ringo'] = Number.MAX_SAFE_INTEGER;

    expect(buyItem(gs, { itemId: 'aomori-ringo', price: 1 })).toBeNull();
    expect(gs.inventory['aomori-ringo']).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('売ると所持品が減って定価の半額を受け取り、キーアイテムは売れない', () => {
    gs = fresh();
    gs.inventory['aomori-ringo'] = 2;
    const apple = c.items.get('aomori-ringo')!;
    const sold = sellItem(gs, apple, 1, 2_000)!;
    expect(sold.inventory[apple.id]).toBe(1);
    expect(sold.player.gold).toBe(gs.player.gold + Math.max(1, Math.floor(apple.price! / 2)));
    expect(sold.updatedAt).toBe(2_000);

    const keyItem = { ...apple, id: 'test-key', kind: 'key' as const };
    gs.inventory[keyItem.id] = 1;
    expect(sellItem(gs, keyItem)).toBeNull();
  });

  it('やどやは HP ぜんかい＋もどり先。おかねが無くても とまれる', () => {
    gs = fresh();
    const hurt = { ...gs, player: { ...gs.player, hp: 3, mp: 0, gold: 0 } };
    const r = innRest(hurt, { hp: 40, mp: 10 }, { map: 'aomori-town', x: 10, y: 20 });
    expect(r.paid).toBe(0);
    expect(r.state.player.hp).toBe(40);
    expect(r.state.progress.lastInn).toEqual({ map: 'aomori-town', x: 10, y: 20 });
  });

  it('不正な負の宿代でお金を増やさない', () => {
    gs = fresh();
    const before = gs.player.gold;
    const result = innRest(gs, { hp: 40, mp: 10 }, { map: 'aomori-town', x: 10, y: 20 }, -100);
    expect(result.paid).toBe(INN_PRICE);
    expect(result.state.player.gold).toBe(before - INN_PRICE);
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

  it('同じ素材が複数行あるレシピは必要数を合算し、在庫を負数にしない', () => {
    gs = fresh();
    gs.inventory['aomori-ringo'] = 2;
    const recipe = {
      id: 'duplicate-material-test',
      result: { itemId: 'aomori-ringo-no-yoroi', n: 1 },
      materials: [
        { itemId: 'aomori-ringo', n: 2 },
        { itemId: 'aomori-ringo', n: 1 },
      ],
      gold: 0,
      unlockedByDefault: true,
    };

    expect(canCraft(gs, recipe)).toBe(false);
    expect(craft(gs, recipe)).toBeNull();
    expect(gs.inventory['aomori-ringo']).toBe(2);
  });

  it('完成品の所持数が安全整数を超える場合は制作しない', () => {
    gs = fresh();
    const recipe = knownRecipes(c.recipes.values(), gs).find((r) => r.id === 'rc-nebuta-no-kabuto')!;
    for (const material of recipe.materials) gs.inventory[material.itemId] = material.n;
    gs.inventory[recipe.result.itemId] = Number.MAX_SAFE_INTEGER;

    expect(canCraft(gs, recipe)).toBe(false);
    expect(craft(gs, recipe)).toBeNull();
    expect(gs.inventory[recipe.result.itemId]).toBe(Number.MAX_SAFE_INTEGER);
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
