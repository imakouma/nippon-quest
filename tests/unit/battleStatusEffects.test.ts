import { describe, expect, it } from 'vitest';
import type { Combatant } from '../../src/core/battle/types';
import { buildStatusEffects } from '../../src/scenes/battle/statusEffectViews';

const combatant = (): Combatant => ({
  id: 'enemy',
  refId: 'enemy',
  name: 'ワスレモノ',
  isHero: false,
  level: 1,
  element: 'none',
  weaknessRevealed: false,
  stats: {
    hp: 20,
    mp: 10,
    scienceAtk: 5,
    humanitiesAtk: 5,
    scienceDef: 5,
    humanitiesDef: 5,
    spd: 5,
    wis: 5,
  },
  hp: 20,
  mp: 10,
  skills: [],
  buffs: {},
  isBoss: false,
  phaseIndex: -1,
  actionsPerTurn: 1,
});

describe('battle status effects', () => {
  it('shows only active attack, defense, and stopped effects', () => {
    const enemy = combatant();
    enemy.buffs = {
      atk: { mult: 1.5, turns: 3 },
      def: { mult: 0.75, turns: 2 },
    };

    expect(buildStatusEffects(enemy, 1)).toEqual([
      { kind: 'attack', direction: 'up', turns: 3 },
      { kind: 'defense', direction: 'down', turns: 2 },
      { kind: 'stopped', direction: 'neutral', turns: 1 },
    ]);

    enemy.buffs.atk = { mult: 2, turns: 0 };
    enemy.buffs.def = { mult: 1, turns: 9 };
    expect(buildStatusEffects(enemy, 0)).toEqual([]);
  });
});
