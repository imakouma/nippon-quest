import { beforeAll, describe, expect, it } from 'vitest';
import type { ContentIndex } from '../../src/core/content/loader';
import { partyFromGameState } from '../../src/core/battle/setup';
import {
  bagCapacity,
  bagContext,
  bagMonsterUids,
  bagUsage,
  evolutionStage,
  evolveRoom,
  nextSlotLevel,
  putEquip,
  setLeader,
  stowNewMonster,
  toggleBagMonster,
  type BagContext,
} from '../../src/core/progression/bag';
import { applyBattleResult, heroLevel, levelForXp } from '../../src/core/progression/battleResult';
import { createNewGame } from '../../src/core/state/newGame';
import type { GameState } from '../../src/core/state/schema';
import { bagCells } from '../../src/ui/field/bagLayout';
import { content } from './helpers';

const cfg = { baseSlots: 3, levelsPerSlot: 2, maxSlots: 12 };
let c: ContentIndex;
beforeAll(async () => {
  c = await content();
});
const fresh = () => createNewGame({ name: 'テスト', grade: 3, starterMonsterId: 'aomori-nebutan' }, 1000);
const ctx = (capacity: number): BagContext => ({ monsters: c.monsters, capacity });
const own = (s: GameState, uid: string, monsterId = 'aomori-ringoron') => {
  s.party.owned.push({ uid, monsterId, level: 1, xp: 0 });
  return s;
};

describe('バッグの マスの数（主人公の レベル）', () => {
  it('さいしょは 3 マス、2 レベルごとに +1、12 マスまで', () => {
    expect(c.settings.bag).toEqual(cfg);
    expect([1, 2, 3, 4, 5, 19, 50].map((lv) => bagCapacity(lv, cfg))).toEqual([3, 3, 4, 4, 5, 12, 12]);
    expect(nextSlotLevel(1, cfg)).toBe(3);
    expect(nextSlotLevel(3, cfg)).toBe(5);
    expect(nextSlotLevel(19, cfg)).toBeNull();
  });

  it('レベルは けいけんち から きまる（player.level が 1 の ままでも マスが ふえる）', () => {
    const table = c.xp.hero;
    expect([0, 19, 20, 81].map((xp) => levelForXp(table, xp))).toEqual([1, 1, 2, 3]);
    const gs = fresh();
    gs.player.xp = 81;
    expect(heroLevel(gs, table)).toBe(3);
    expect(bagContext(gs, c).capacity).toBe(4);
  });
});

describe('仲間は しんかの だんかい ぶん マスを つかう', () => {
  it('しんか前 1・1 かい しんか 2・2 かい しんか 3', () => {
    const stage = (id: string) => evolutionStage(id, c.monsters);
    expect(stage('aomori-nebutan')).toBe(1);
    expect(stage('aomori-nebuta-musha')).toBe(2);
    expect(stage('aomori-nebuta-taisho')).toBe(3);
    expect(stage('aomori-ringoron')).toBe(1);
    expect(stage('aomori-ringo-knight')).toBe(2);
  });

  it('マスが たりないと 入れられない。出すと あいて 入れられる', () => {
    let s = own(own(fresh(), 'musha', 'aomori-nebuta-musha'), 'ringo');
    expect(bagMonsterUids(s)).toEqual(['starter']);
    const r1 = toggleBagMonster(s, 'musha', ctx(3));
    expect(r1.result).toBe('added');
    s = r1.state;
    expect(bagUsage(s, ctx(3))).toMatchObject({ used: 3, free: 0 });
    expect(toggleBagMonster(s, 'ringo', ctx(3)).result).toBe('full');
    s = toggleBagMonster(s, 'musha', ctx(3)).state;
    expect(toggleBagMonster(s, 'ringo', ctx(3)).result).toBe('added');
  });
});

describe('バトルに 出るのは バッグの 仲間だけ', () => {
  it('3 体より 多くても ぜんぶ 出る。あずけている 仲間は 出ない', () => {
    let s = fresh();
    for (let i = 1; i <= 6; i++) s = own(s, `m${i}`);
    for (let i = 1; i <= 5; i++) s = toggleBagMonster(s, `m${i}`, ctx(12)).state;
    const party = partyFromGameState(s, c);
    expect(party.monsters.map((m) => m.id)).toEqual(['starter', 'm1', 'm2', 'm3', 'm4', 'm5']);
  });

  it('せんとうは バッグの 先頭。出すと つぎの 仲間が せんとう。ぜんぶ 出すと 主人公 ひとり', () => {
    let s = toggleBagMonster(own(fresh(), 'm1'), 'm1', ctx(3)).state;
    s = setLeader(s, 'm1');
    expect(bagMonsterUids(s)).toEqual(['m1', 'starter']);
    expect(partyFromGameState(s, c).monsters[0]!.id).toBe('m1');
    s = toggleBagMonster(s, 'm1', ctx(3)).state;
    expect(s.party.activeUid).toBe('starter');
    s = toggleBagMonster(s, 'starter', ctx(3)).state;
    expect(bagMonsterUids(s)).toEqual([]);
    expect(s.party.activeUid).toBeNull();
    expect(partyFromGameState(s, c).monsters).toEqual([]);
    expect(setLeader(s, 'm1')).toBe(s); // バッグに いない 仲間は せんとうに できない
  });

  it('team が 空の 古いセーブは せんとうの 1 体だけ', () => {
    const s = own(own(fresh(), 'm1'), 'm2');
    s.party.team = [];
    expect(bagMonsterUids(s)).toEqual(['starter']);
  });
});

describe('そうびは 1 こ 1 マス（バッグに いれる ＝ そうびする）', () => {
  it('あいていなければ いれられないが、同じ部位の 入れかえは できる', () => {
    const [w1, w2] = [...c.items.values()].filter((i) => i.kind === 'weapon');
    const head = [...c.items.values()].find((i) => i.kind === 'head')!;
    let s = fresh();
    for (const it of [w1!, w2!, head]) s.inventory[it.id] = 1;
    const room = ctx(2); // ネブタン 1 ＋ あき 1
    const a = putEquip(s, w1!, room);
    expect(a.result).toBe('added');
    s = a.state;
    expect(s.player.equipment.weapon).toBe(w1!.id);
    expect(bagUsage(s, room)).toMatchObject({ used: 2, free: 0 });
    expect(putEquip(s, head, room).result).toBe('full');
    const b = putEquip(s, w2!, room);
    expect(b).toMatchObject({ result: 'swapped', old: w1!.id });
    expect(b.state.inventory[w1!.id]).toBe(1); // 前の そうびは あずける
    expect(putEquip(fresh(), w1!, room).result).toBe('none'); // もっていない
  });
});

describe('しんかと 仲間化', () => {
  it('しんかで マスが ふえて バッグに 入りきらないと しんか できない（バッグの 外なら できる）', () => {
    let s = own(own(fresh(), 'r1'), 'r2');
    s = toggleBagMonster(s, 'r1', ctx(3)).state;
    s = toggleBagMonster(s, 'r2', ctx(3)).state;
    expect(evolveRoom(s, 'starter', ctx(3))).toEqual({ extra: 1, ok: false });
    const out = toggleBagMonster(s, 'r2', ctx(3)).state;
    expect(evolveRoom(out, 'starter', ctx(3))).toEqual({ extra: 1, ok: true });
    expect(evolveRoom(out, 'r2', ctx(3))).toEqual({ extra: 0, ok: true });
  });

  it('仲間に なったら マスが あれば バッグへ、たりなければ あずける', () => {
    const won = applyBattleResult(
      fresh(),
      {
        outcome: 'recruited',
        enemyRefId: 'aomori-ringoron',
        enemyLevel: 2,
        heroHp: 10,
        heroMp: 0,
        heroMaxHp: 40,
        heroMaxMp: 10,
        xp: 0,
        gold: 0,
        drops: [],
        items: {},
        recruitAccepted: false,
        perfectBySubject: {},
      },
      c.settings,
    );
    const uid = won.newMonsterUid!;
    expect(bagMonsterUids(won.state)).not.toContain(uid);
    expect(stowNewMonster(won.state, uid, ctx(3))).toMatchObject({ inBag: true });
    expect(bagMonsterUids(stowNewMonster(won.state, uid, ctx(3)).state)).toContain(uid);
    expect(stowNewMonster(won.state, uid, ctx(1))).toMatchObject({ inBag: false });
  });
});

describe('バッグの マスの ならび（画面）', () => {
  it('入れた もの → あいている マス → まだ ひらいていない マス（あく レベル）', () => {
    const cells = bagCells(
      [
        { key: 'a', cost: 1 },
        { key: 'b', cost: 2 },
      ],
      4,
      cfg,
    );
    expect(cells.slice(0, 3)).toEqual([
      { kind: 'item', key: 'a', span: 1 },
      { kind: 'item', key: 'b', span: 2 },
      { kind: 'empty' },
    ]);
    expect(cells.slice(3).map((x) => (x.kind === 'locked' ? x.level : x.kind))).toEqual([
      5, 7, 9, 11, 13, 15, 17, 19,
    ]);
  });

  it('マスより 多く 入っている 古いセーブは あきなし・ひらいていない マスは その あとから', () => {
    const cells = bagCells(
      [
        { key: 'a', cost: 3 },
        { key: 'b', cost: 2 },
      ],
      3,
      cfg,
    );
    expect(cells.filter((x) => x.kind === 'empty')).toHaveLength(0);
    expect(cells.filter((x) => x.kind === 'locked')).toHaveLength(cfg.maxSlots - 5);
  });
});
