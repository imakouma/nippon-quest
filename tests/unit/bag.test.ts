import { beforeAll, describe, expect, it } from 'vitest';
import type { ContentIndex } from '../../src/core/content/loader';
import { partyFromGameState } from '../../src/core/battle/setup';
import {
  activeEquipment,
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
import { chooseStoryCompanion } from '../../src/core/progression/storyCompanion';
import type { GameState } from '../../src/core/state/schema';
import { bagCells } from '../../src/ui/field/bagLayout';
import { content } from './helpers';

let c: ContentIndex;
beforeAll(async () => {
  c = await content();
});
const fresh = () => chooseStoryCompanion(createNewGame({ name: 'テスト', grade: 3 }, 1000), 'iwate-kagurabi');
const own = (s: GameState, uid: string, monsterId = 'aomori-ringoron') => {
  s.party.owned.push({ uid, monsterId, level: 1, xp: 0 });
  return s;
};

describe('2Dバッグ', () => {
  it('3x3から始まり、東北クリアで4x3へ広がる', () => {
    const s = fresh();
    expect(bagDimensions(s)).toEqual({ w: 3, h: 3 });
    s.progress.islandsCleared = ['tohoku'];
    expect(bagDimensions(s)).toEqual({ w: 4, h: 3 });
    s.progress.islandsCleared = ['tohoku', 'hokkaido'];
    expect(bagDimensions(s)).toEqual({ w: 4, h: 3 });
    s.progress.islandsCleared = ['a', 'b', 'c', 'd'];
    expect(bagDimensions(s)).toEqual({ w: 4, h: 3 });
  });

  it('主人公と物語で選んだ相棒がグリッドに入り、空きは2マス', () => {
    const s = fresh();
    expect(s.party.bagPlacements.hero).toMatchObject({ x: 1, y: 1 });
    expect(s.party.bagPlacements['mon:story-companion']).toMatchObject({ x: 1, y: 0 });
    expect(bagUsage(s, bagContext(s, c))).toMatchObject({ used: 2, capacity: 9, free: 7 });
  });

  it('ドラッグ相当の移動は衝突と境界を検査する', () => {
    const s = fresh();
    const ctx = bagContext(s, c);
    expect(moveBagThing(s, 'mon:story-companion', { x: 1, y: 1 }, ctx)).toBeNull();
    expect(
      moveBagThing(s, 'mon:story-companion', { x: 0, y: 0 }, ctx)?.party.bagPlacements['mon:story-companion'],
    ).toMatchObject({ x: 0, y: 0 });
  });

  it('不正座標・存在しないキー・未配置の仲間を注入しない', () => {
    const s = fresh();
    own(s, 'outside');
    const ctx = bagContext(s, c);

    expect(moveBagThing(s, 'mon:story-companion', { x: Number.NaN, y: 1 }, ctx)).toBeNull();
    expect(moveBagThing(s, 'mon:story-companion', { x: 0.5, y: 1 }, ctx)).toBeNull();
    expect(moveBagThing(s, 'eq:not-a-slot', { x: 0, y: 1 }, ctx)).toBeNull();
    expect(moveBagThing(s, 'mon:outside', { x: 0, y: 1 }, ctx)).toBeNull();
    expect(s.party.bagPlacements).toEqual({
      hero: { x: 1, y: 1, rotated: false },
      'mon:story-companion': { x: 1, y: 0, rotated: false },
    });
  });

  it('通常キャラは1x1、ボスは2x2', () => {
    expect(monsterSize('aomori-nebutan', c.monsters)).toEqual({ w: 1, h: 1 });
    expect(monsterSize('tohoku-boss-rokufuyu', c.monsters)).toEqual({ w: 2, h: 2 });
  });
});

describe('バッグ内と控え', () => {
  it('バッグから出すと控えになり、戦闘ロスターには残る', () => {
    const s = fresh();
    const out = toggleBagMonster(s, 'story-companion', bagContext(s, c));
    expect(out.result).toBe('removed');
    expect(bagMonsterUids(out.state)).toEqual([]);
    expect(reserveMonsterUids(out.state)).toEqual(['story-companion']);
    expect(battleRosterUids(out.state)).toEqual(['story-companion']);
    expect(partyFromGameState(out.state, c).monsters.map((m) => m.id)).toEqual(['story-companion']);
  });

  it('主人公を含め最大8体（仲間7体）まで編成する', () => {
    let s = fresh();
    s = toggleBagMonster(s, 'story-companion', bagContext(s, c)).state;
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

  it('同じ仲間の再収納は配置を変えず、存在しないUIDを控えへ追加しない', () => {
    const s = fresh();
    const same = stowNewMonster(s, 'story-companion', bagContext(s, c));
    expect(same.state).toBe(s);
    expect(same.inBag).toBe(true);
    expect(same.state.party.team).toEqual(['story-companion']);

    const missing = stowNewMonster(s, 'missing', bagContext(s, c));
    expect(missing.state).toBe(s);
    expect(missing.inBag).toBe(false);
    expect(missing.state.party.reserve).not.toContain('missing');
  });
});

describe('装備・隣接効果・描画セル', () => {
  it('装備は空きセルへ入り、バッグを1マス使う', () => {
    const s = fresh();
    s.progress.islandsCleared = ['tohoku'];
    const weapon = [...c.items.values()].find((i) => i.kind === 'weapon')!;
    s.inventory[weapon.id] = 1;
    const result = putEquip(s, weapon, bagContext(s, c));
    expect(result.result).toBe('added');
    expect(result.state.party.bagPlacements['eq:weapon']).toBeDefined();
    expect(bagUsage(result.state, bagContext(result.state, c)).used).toBe(3);
  });

  it('東北クリア前は装備できず、解放後は自由に動かせて正しい隣接位置だけで効果が出る', () => {
    const s = fresh();
    const weapon = [...c.items.values()].find((i) => i.kind === 'weapon' && i.id !== 'common-renshu-no-bou')!;
    s.inventory[weapon.id] = 1;
    expect(putEquip(s, weapon, bagContext(s, c)).result).toBe('none');
    s.progress.islandsCleared = ['tohoku'];
    const placed = putEquip(s, weapon, bagContext(s, c));
    expect(placed.state.party.bagPlacements['eq:weapon']).toMatchObject({ x: 2, y: 1 });
    expect(activeEquipment(placed.state).weapon).toBe(weapon.id);
    const moved = moveBagThing(placed.state, 'eq:weapon', { x: 0, y: 2 }, bagContext(placed.state, c));
    expect(moved?.party.bagPlacements['eq:weapon']).toMatchObject({ x: 0, y: 2 });
    expect(activeEquipment(moved!).weapon).toBeUndefined();
  });

  it('序盤はれんしゅうのぼうだけを主人公の右に装備できる', () => {
    const s = fresh();
    const beforeAtk = partyFromGameState(s, c).hero.stats.atk;
    const starter = c.items.get('common-renshu-no-bou')!;
    const placed = putEquip(s, starter, bagContext(s, c));
    expect(placed.result).toBe('added');
    expect(placed.state.party.bagPlacements['eq:weapon']).toMatchObject({ x: 2, y: 1 });
    expect(activeEquipment(placed.state).weapon).toBe(starter.id);
    expect(partyFromGameState(placed.state, c).hero.stats.atk).toBe(beforeAtk + 1);
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
