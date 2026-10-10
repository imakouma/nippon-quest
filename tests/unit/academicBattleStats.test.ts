import { describe, expect, it } from 'vitest';
import { statsAtLevel } from '../../src/core/battle/factory';
import { pokemonLikeBaseDamage, selectAcademicStats } from '../../src/core/battle/damage';
import { commandPriority, initiativeOrder } from '../../src/core/battle/initiative';
import type { Stats } from '../../src/core/content/schemas';
import { createRng } from '../../src/core/rng';

const base: Stats = {
  hp: 24,
  mp: 6,
  scienceAtk: 5,
  humanitiesAtk: 5,
  scienceDef: 4,
  humanitiesDef: 4,
  spd: 5,
  wis: 3,
};

const growth = {
  base: {
    hp: 2,
    mp: 0.4,
    scienceAtk: 0.4,
    humanitiesAtk: 0.4,
    scienceDef: 0.3,
    humanitiesDef: 0.3,
    spd: 0.3,
    wis: 0,
  },
  every5: { hp: 2, mp: 1, scienceAtk: 1, humanitiesAtk: 1, scienceDef: 1, humanitiesDef: 1, spd: 1, wis: 0 },
  every10: { hp: 3, mp: 1, scienceAtk: 1, humanitiesAtk: 1, scienceDef: 1, humanitiesDef: 1, spd: 1, wis: 1 },
};

describe('文理ステータス', () => {
  it('Lv1は基礎値そのまま、Lv5とLv10で節目成長する', () => {
    expect(statsAtLevel(base, growth, 1)).toEqual(base);
    expect(statsAtLevel(base, growth, 5)).toMatchObject({ hp: 34, scienceAtk: 7, wis: 3 });
    expect(statsAtLevel(base, growth, 10)).toMatchObject({ hp: 49, scienceAtk: 11, wis: 4 });
  });

  it('理系・文系・balancedで参照する攻防を切り替える', () => {
    const attacker = { ...base, scienceAtk: 9, humanitiesAtk: 5 };
    const defender = { ...base, scienceDef: 8, humanitiesDef: 4 };
    expect(selectAcademicStats(attacker, defender, 'science')).toEqual({ attack: 9, defense: 8 });
    expect(selectAcademicStats(attacker, defender, 'humanities')).toEqual({ attack: 5, defense: 4 });
    expect(selectAcademicStats(attacker, defender, 'balanced')).toEqual({ attack: 7, defense: 6 });
  });

  it('ポケモン型基礎ダメージを段階ごとに切り捨てる', () => {
    expect(pokemonLikeBaseDamage(10, 120, 10, 8)).toBe(20);
    expect(pokemonLikeBaseDamage(1, 90, 5, 4)).toBe(6);
  });

  it('優先行動の後は素早い順で、同速は同じシードなら同じ順になる', () => {
    expect(commandPriority({ kind: 'flee' })).toBe(1);
    expect(commandPriority({ kind: 'attack' })).toBe(0);
    const entries = [
      { actor: 'hero' as const, speed: 5, priority: 0 },
      { actor: 'companion' as const, speed: 8, priority: 0 },
      { actor: 'enemy' as const, speed: 5, priority: 0 },
    ];
    const first = initiativeOrder(entries, createRng('same-speed'));
    const replay = initiativeOrder(entries, createRng('same-speed'));
    expect(first[0]).toBe('companion');
    expect(replay).toEqual(first);
  });

  it('逃走や交代は相手が速くても先に解決する', () => {
    expect(
      initiativeOrder(
        [
          { actor: 'hero', speed: 1, priority: commandPriority({ kind: 'swap', monsterIndex: 0 }) },
          { actor: 'enemy', speed: 999, priority: 0 },
        ],
        createRng('priority'),
      )[0],
    ).toBe('hero');
  });
});
