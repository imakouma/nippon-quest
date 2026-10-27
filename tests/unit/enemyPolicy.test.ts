import { describe, expect, it } from 'vitest';
import type { Rng } from '../../src/core/rng';
import {
  AGGRESSIVE_ENEMY_TACTICS,
  STANDARD_ENEMY_TACTICS,
  selectEnemyIntent,
  type EnemyDecisionContext,
} from '../../src/core/battle/enemyPolicy';

function fakeRng(nextValue: number, calls: string[]): Rng {
  return {
    next: () => {
      calls.push('next');
      return nextValue;
    },
    int: () => 0,
    pick: (items) => {
      calls.push('pick');
      if (!items[0]) throw new Error('empty fake pick');
      return items[0];
    },
    chance: () => false,
    weighted: (items) => {
      if (!items[0]) throw new Error('empty fake weighted');
      return items[0].item;
    },
    state: () => null,
  };
}

const context = (overrides: Partial<EnemyDecisionContext> = {}): EnemyDecisionContext => ({
  hp: 80,
  maxHp: 100,
  mp: 10,
  skills: [
    { id: 'damage', effect: 'damage', mp: 2 },
    { id: 'heal', effect: 'heal', mp: 3 },
  ],
  ...overrides,
});

describe('enemy tactics policy', () => {
  it.each([
    [0.299, { kind: 'skill', skillId: 'damage' }],
    [0.3, { kind: 'attack' }],
    [0.899, { kind: 'attack' }],
    [0.9, { kind: 'defend' }],
  ] as const)('標準戦術は抽選値 %s を現行の30/60/10境界へ割り当てる', (roll, expected) => {
    const calls: string[] = [];

    expect(selectEnemyIntent(context(), STANDARD_ENEMY_TACTICS, fakeRng(roll, calls))).toEqual(expected);
    expect(calls).toEqual(expected.kind === 'skill' ? ['next', 'pick'] : ['next']);
  });

  it('HP 30%以下では最初の抽選を消費してから使用可能な回復技を優先する', () => {
    const calls: string[] = [];

    expect(selectEnemyIntent(context({ hp: 30 }), STANDARD_ENEMY_TACTICS, fakeRng(0.95, calls))).toEqual({
      kind: 'heal',
      skillId: 'heal',
    });
    expect(calls).toEqual(['next']);
  });

  it('回復技や攻撃技が使用不能なら現行どおり通常攻撃へフォールバックする', () => {
    const calls: string[] = [];
    const input = context({ hp: 20, mp: 0 });

    expect(selectEnemyIntent(input, STANDARD_ENEMY_TACTICS, fakeRng(0.1, calls))).toEqual({
      kind: 'attack',
    });
    expect(calls).toEqual(['next']);
  });

  it('戦術を差し替えると同じ状態と抽選値から別の合法な行動を選べる', () => {
    const standard = selectEnemyIntent(context(), STANDARD_ENEMY_TACTICS, fakeRng(0.5, []));
    const aggressive = selectEnemyIntent(context(), AGGRESSIVE_ENEMY_TACTICS, fakeRng(0.5, []));

    expect(standard).toEqual({ kind: 'attack' });
    expect(aggressive).toEqual({ kind: 'skill', skillId: 'damage' });
  });

  it('行動選択は入力状態を変更しない', () => {
    const input = context({ hp: 30 });
    const before = structuredClone(input);

    selectEnemyIntent(input, STANDARD_ENEMY_TACTICS, fakeRng(0.2, []));

    expect(input).toEqual(before);
  });
});
