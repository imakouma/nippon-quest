import { beforeAll, describe, expect, it } from 'vitest';
import type { ContentIndex } from '../../src/core/content/loader';
import { partyFromGameState } from '../../src/core/battle/setup';
import {
  adjacencyBonus,
  bagContext,
  bagDimensions,
  bagMonsterUids,
  bagUsage,
  battleRosterUids,
  MAX_COMPANIONS,
  monsterSize,
  moveBagThing,
  putEquip,
  reserveMonsterUids,
  stowNewMonster,
  toggleBagMonster,
} from '../../src/core/progression/bag';
import { createNewGame } from '../../src/core/state/newGame';
import type { GameState } from '../../src/core/state/schema';
import { bagCells } from '../../src/ui/field/bagLayout';
import { content } from './helpers';

let c: ContentIndex;
beforeAll(async () => {
  c = await content();
});
const fresh = () => createNewGame({ name: 'テスト', grade: 3, starterMonsterId: 'aomori-nebutan' }, 1000);
const own = (s: GameState, uid: string, monsterId = 'aomori-ringoron') => {
  s.party.owned.push({ uid, monsterId, level: 1, xp: 0 });
  return s;
};

describe('2Dバッグ', () => {
  it('2x2から始まり、島クリアで段階的に広がる', () => {
    const s = fresh();
    expect(bagDimensions(s)).toEqual({ w: 2, h: 2 });
    s.progress.islandsCleared = ['tohoku'];
    expect(bagDimensions(s)).toEqual({ w: 3, h: 2 });
    s.progress.islandsCleared = ['tohoku', 'hokkaido'];
    expect(bagDimensions(s)).toEqual({ w: 3, h: 3 });
    s.progress.islandsCleared = ['a', 'b', 'c', 'd'];
    expect(bagDimensions(s)).toEqual({ w: 4, h: 3 });
  });

  it('主人公とスターターが初期グリッドに入り、空きは2マス', () => {
    const s = fresh();
    expect(s.party.bagPlacements.hero).toMatchObject({ x: 0, y: 0 });
    expect(s.party.bagPlacements['mon:starter']).toMatchObject({ x: 1, y: 0 });
    expect(bagUsage(s, bagContext(s, c))).toMatchObject({ used: 2, capacity: 4, free: 2 });
  });

  it('ドラッグ相当の移動は衝突と境界を検査する', () => {
    const s = fresh();
    const ctx = bagContext(s, c);
    expect(moveBagThing(s, 'mon:starter', { x: 0, y: 0 }, ctx)).toBeNull();
    expect(
      moveBagThing(s, 'mon:starter', { x: 1, y: 1 }, ctx)?.party.bagPlacements['mon:starter'],
    ).toMatchObject({ x: 1, y: 1 });
  });

  it('通常キャラは1x1、ボスは2x2', () => {
    expect(monsterSize('aomori-nebutan', c.monsters)).toEqual({ w: 1, h: 1 });
    expect(monsterSize('tohoku-boss-rokufuyu', c.monsters)).toEqual({ w: 2, h: 2 });
  });
});

describe('バッグ内と控え', () => {
  it('バッグから出すと控えになり、戦闘ロスターには残る', () => {
    const s = fresh();
    const out = toggleBagMonster(s, 'starter', bagContext(s, c));
    expect(out.result).toBe('removed');
    expect(bagMonsterUids(out.state)).toEqual([]);
    expect(reserveMonsterUids(out.state)).toEqual(['starter']);
    expect(battleRosterUids(out.state)).toEqual(['starter']);
    expect(partyFromGameState(out.state, c).monsters.map((m) => m.id)).toEqual(['starter']);
  });

  it('主人公を含め最大8体（仲間7体）まで編成する', () => {
    let s = fresh();
    s = toggleBagMonster(s, 'starter', bagContext(s, c)).state;
    for (let i = 1; i <= MAX_COMPANIONS; i++) {
      own(s, `m${i}`);
      const stowed = stowNewMonster(s, `m${i}`, bagContext(s, c));
      s = stowed.state;
    }
    expect(battleRosterUids(s)).toHaveLength(MAX_COMPANIONS);
    own(s, 'extra');
    expect(stowNewMonster(s, 'extra', bagContext(s, c)).inBag).toBe(false);
    expect(battleRosterUids(s)).toHaveLength(MAX_COMPANIONS);
  });
});

describe('装備・隣接効果・描画セル', () => {
  it('装備は空きセルへ入り、バッグを1マス使う', () => {
    const s = fresh();
    const weapon = [...c.items.values()].find((i) => i.kind === 'weapon')!;
    s.inventory[weapon.id] = 1;
    const result = putEquip(s, weapon, bagContext(s, c));
    expect(result.result).toBe('added');
    expect(result.state.party.bagPlacements['eq:weapon']).toBeDefined();
    expect(bagUsage(result.state, bagContext(result.state, c)).used).toBe(3);
  });

  it('主人公に隣接した仲間が属性に応じた5%支援を与える', () => {
    const s = fresh();
    const bonus = adjacencyBonus(s, bagContext(s, c), s.player.baseStats);
    expect(bonus.labels).toHaveLength(1);
    expect(Object.values(bonus.stats).some((v) => (v ?? 0) > 0)).toBe(true);
  });

  it('2Dセルは配置物と空きセルを返す', () => {
    const cells = bagCells(
      [
        { key: 'hero', x: 0, y: 0, w: 1, h: 1 },
        { key: 'boss', x: 1, y: 0, w: 2, h: 2 },
      ],
      3,
      2,
    );
    expect(cells.filter((x) => x.kind === 'item')).toHaveLength(2);
    expect(cells.filter((x) => x.kind === 'empty')).toEqual([{ kind: 'empty', x: 0, y: 1 }]);
  });
});
