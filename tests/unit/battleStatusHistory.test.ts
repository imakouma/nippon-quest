import { beforeAll, describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState, Combatant, EnemyUnit } from '../../src/core/battle/types';
import { buildBattleHistoryView, buildStatusEffects } from '../../src/scenes/battle/statusHistoryViews';
import type { NarrateCtx } from '../../src/scenes/battle/narrate';
import { setDictionary } from '../../src/ui/i18n';
import { NORMAL_BATTLE_RULESET } from '../../src/core/battle/ruleset';

const stats = {
  hp: 20,
  mp: 10,
  scienceAtk: 5,
  humanitiesAtk: 5,
  scienceDef: 5,
  humanitiesDef: 5,
  spd: 5,
  wis: 5,
};

function combatant(id: string, name: string, hp: number): Combatant {
  return {
    id,
    refId: id,
    name,
    isHero: id === 'hero',
    level: 1,
    element: 'none',
    weaknessRevealed: false,
    stats: { ...stats },
    hp,
    mp: 10,
    skills: [],
    buffs: {},
    isBoss: false,
    phaseIndex: -1,
    actionsPerTurn: 1,
  };
}

const events: BattleEvent[] = [
  { t: 'turnStart', turn: 1 },
  {
    t: 'act',
    actionId: 'turn:1:action:0',
    side: 'ally',
    actorId: 'hero',
    targetIds: ['enemy'],
    command: 'attack',
  },
  {
    t: 'damage',
    actionId: 'turn:1:action:0',
    side: 'enemy',
    targetId: 'enemy',
    amount: 5,
    critical: false,
    elementMult: 1,
    weakness: false,
    scoreBand: null,
    comboMult: 1,
  },
  { t: 'heal', actionId: 'turn:1:action:1', side: 'ally', targetId: 'hero', amount: 3 },
  { t: 'turnStart', turn: 2 },
  {
    t: 'buff',
    actionId: 'turn:2:action:0',
    side: 'enemy',
    targetId: 'enemy',
    stat: 'def',
    mult: 0.75,
    turns: 2,
  },
  { t: 'status', actionId: 'turn:2:action:0', targetId: 'enemy', turns: 1 },
  { t: 'skipTurn', actionId: 'turn:2:action:1', targetId: 'enemy', remain: 0 },
  {
    t: 'act',
    actionId: 'turn:2:action:2',
    side: 'enemy',
    actorId: 'enemy',
    targetIds: ['hero'],
    command: 'attack',
  },
  {
    t: 'damage',
    actionId: 'turn:2:action:2',
    side: 'ally',
    targetId: 'hero',
    amount: 4,
    critical: false,
    elementMult: 1,
    weakness: false,
    scoreBand: null,
    comboMult: 1,
  },
];

function battle(log: BattleEvent[] = events): BattleState {
  const hero = combatant('hero', 'ハル', 16);
  const enemy: EnemyUnit = { ...combatant('enemy', 'ワスレモノ', 15), skipTurns: 1 };
  return {
    turn: 2,
    ally: { hero, monsters: [], activeMonsterIndex: 0, items: {} },
    enemy,
    player: {
      subjectGauges: { kokugo: 0, sansu: 0, rika: 0, shakai: 0, eigo: 0, seikatsu: 0 },
      comboCount: 0,
      maxCombo: 0,
    },
    companion: null,
    rngState: null,
    seed: 'history-test',
    outcome: 'ongoing',
    isBossBattle: false,
    ruleset: NORMAL_BATTLE_RULESET,
    log,
  };
}

const narrateCtx: NarrateCtx = {
  nameOf: (id) => (id === 'hero' ? 'ハル' : 'ワスレモノ'),
  skillName: (id) => id,
  itemName: (id) => id,
  elementName: (id) => id,
  subjectName: (id) => id,
  enemyName: 'ワスレモノ',
  isBossBattle: false,
};

beforeAll(() => {
  setDictionary({
    battle: {
      attack: '{name}の こうげき！',
      damageToEnemy: '{name}に {n}の ダメージ！',
      damageToAlly: '{name}は {n}の ダメージを うけた！',
      heal: '{name}の HPが {n} かいふくした！',
      defDown: '{name}の ぼうぎょが さがった！',
      statusStop: '{name}の うごきを {n}ターン とめた！',
      skipTurn: '{name}は うごけない！',
    },
  });
});

describe('battle status effects', () => {
  it('shows only active attack, defense, and stopped effects', () => {
    const enemy = battle().enemy;
    enemy.buffs = {
      atk: { mult: 1.5, turns: 3 },
      def: { mult: 0.75, turns: 2 },
    };

    expect(buildStatusEffects(enemy, enemy.skipTurns)).toEqual([
      { kind: 'attack', direction: 'up', turns: 3 },
      { kind: 'defense', direction: 'down', turns: 2 },
      { kind: 'stopped', direction: 'neutral', turns: 1 },
    ]);

    enemy.buffs.atk = { mult: 2, turns: 0 };
    enemy.buffs.def = { mult: 1, turns: 9 };
    expect(buildStatusEffects(enemy, 0)).toEqual([]);
  });
});

describe('battle history projection', () => {
  it('keeps the latest four narrated events in original event order', () => {
    const view = buildBattleHistoryView(battle(), narrateCtx, events.length, false);

    expect(view.recent.map((entry) => entry.eventIndex)).toEqual([7, 8, 9, 10]);
    expect(view.recent.map((entry) => entry.lines[0])).toEqual([
      'ワスレモノの うごきを 1ターン とめた！',
      'ワスレモノは うごけない！',
      'ワスレモノの こうげき！',
      'ハルは 4の ダメージを うけた！',
    ]);
    expect(view.timeline).toEqual([]);
  });

  it('reconstructs damage and healing HP and annotates event number and turn', () => {
    const state = battle();
    const before = structuredClone(state.log);
    const view = buildBattleHistoryView(state, narrateCtx, events.length, true);

    expect(view.timeline[2]).toMatchObject({
      eventIndex: 3,
      turn: 1,
      t: 'damage',
      side: 'enemy',
      targetId: 'enemy',
      hp: { before: 20, after: 15, delta: -5 },
    });
    expect(view.timeline[3]).toMatchObject({
      eventIndex: 4,
      turn: 1,
      t: 'heal',
      side: 'ally',
      targetId: 'hero',
      hp: { before: 17, after: 20, delta: 3 },
    });
    expect(view.timeline[8]).toMatchObject({
      eventIndex: 9,
      turn: 2,
      t: 'act',
      side: 'enemy',
      actorId: 'enemy',
      command: 'attack',
    });
    expect(state.log).toEqual(before);
  });

  it('does not expose unpresented events and caps the developer DOM model at 120 rows', () => {
    const longLog = Array.from({ length: 125 }, (_, index): BattleEvent => ({
      t: 'turnStart',
      turn: index + 1,
    }));
    const partial = buildBattleHistoryView(battle(longLog), narrateCtx, 123, true);

    expect(partial.timeline).toHaveLength(120);
    expect(partial.timeline[0]?.eventIndex).toBe(4);
    expect(partial.timeline.at(-1)?.eventIndex).toBe(123);
    expect(partial.omittedTimelineEvents).toBe(3);
    expect(partial.totalPresentedEvents).toBe(123);
  });
});
