import { beforeAll, describe, expect, it } from 'vitest';
import type { ContentIndex } from '../../src/core/content/loader';
import { AGGRESSIVE_ENEMY_TACTICS, STANDARD_ENEMY_TACTICS } from '../../src/core/battle/enemyPolicy';
import { act, createBattle, type BattleDeps } from '../../src/core/battle/engine';
import { makeHero, makeMonster, makeParty } from '../../src/core/battle/factory';
import {
  BOSS_BATTLE_RULESET,
  EVENT_BATTLE_RULESET,
  NORMAL_BATTLE_RULESET,
  TUTORIAL_BATTLE_RULESET,
  resolveBattleRuleset,
  shouldPersistBattleResult,
  type BattleRuleset,
} from '../../src/core/battle/ruleset';
import type { ActionResult, BattleState } from '../../src/core/battle/types';
import { battleItemAvailability, buildCommandOptions } from '../../src/scenes/battle/hudViews';
import { canRecruitByCommand } from '../../src/scenes/battle/recruitFlow';
import { content, deps } from './helpers';

let D: BattleDeps;
let C: ContentIndex;
beforeAll(async () => {
  [D, C] = await Promise.all([deps(), content()]);
});

const answer: ActionResult = { score: 1, timeMs: 1000, attempts: 1 };

function battle(ruleset?: BattleRuleset): BattleState {
  const hero = makeHero(
    {
      name: 'ハル',
      level: 5,
      baseStats: {
        hp: 40,
        mp: 10,
        scienceAtk: 8,
        humanitiesAtk: 8,
        scienceDef: 6,
        humanitiesDef: 6,
        spd: 99,
        wis: 5,
      },
      growth: { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, wis: 0 },
      skills: [],
      equipment: {},
    },
    C.items,
    C.sets,
  );
  const enemy = makeMonster(C.monsters.get('aomori-ringoron')!, 3, 'enemy');
  hero.hp = 9999;
  hero.stats.hp = 9999;
  enemy.hp = 9999;
  enemy.stats.hp = 9999;
  return createBattle(
    {
      ally: makeParty(hero, [], { 'aomori-ringo': 1 }),
      enemy,
      seed: 'ruleset-golden',
      ruleset,
    },
    D,
  );
}

describe('battle ruleset presets', () => {
  it('通常戦は現在の逃走・仲間化・報酬・問題・保存パーティを既定値にする', () => {
    expect(NORMAL_BATTLE_RULESET).toMatchObject({
      id: 'normal',
      enemyTactics: STANDARD_ENEMY_TACTICS,
      flee: { mode: 'speed-check' },
      recruitment: { mode: 'standard' },
      rewards: { mode: 'standard' },
      questions: { mode: 'skill-driven' },
      party: { source: 'saved', persistence: 'standard' },
    });
  });

  it('ボス戦は逃走と仲間化だけを禁止し、通常報酬と保存パーティを維持する', () => {
    expect(BOSS_BATTLE_RULESET).toMatchObject({
      id: 'boss',
      flee: { mode: 'blocked' },
      recruitment: { mode: 'disabled' },
      rewards: { mode: 'standard' },
      questions: { mode: 'skill-driven' },
      party: { source: 'saved', persistence: 'standard' },
    });
  });

  it('チュートリアル戦は scripted 問題と supplied party を使い、結果を保存しない', () => {
    expect(TUTORIAL_BATTLE_RULESET).toMatchObject({
      id: 'tutorial',
      flee: { mode: 'blocked' },
      recruitment: { mode: 'disabled' },
      rewards: { mode: 'none' },
      questions: { mode: 'scripted' },
      party: { source: 'provided', persistence: 'discard' },
    });
  });

  it('イベント戦は非ボス時に現在の script battle 挙動を維持する', () => {
    expect(EVENT_BATTLE_RULESET).toMatchObject({
      id: 'event',
      flee: { mode: 'speed-check' },
      recruitment: { mode: 'standard' },
      rewards: { mode: 'standard' },
      questions: { mode: 'skill-driven' },
      party: { source: 'saved', persistence: 'standard' },
    });
  });
});

describe('resolveBattleRuleset', () => {
  it('kind のない既存入力を isBossBattle から normal / boss へ互換解決する', () => {
    expect(resolveBattleRuleset({ isBossBattle: false }).id).toBe('normal');
    expect(resolveBattleRuleset({ isBossBattle: true }).id).toBe('boss');
  });

  it('既存 dev mode のボス逃走だけを speed-check へ戻す', () => {
    const ruleset = resolveBattleRuleset({ isBossBattle: true, canFleeBoss: true });

    expect(ruleset.id).toBe('boss');
    expect(ruleset.flee).toEqual({ mode: 'speed-check' });
    expect(ruleset.recruitment).toEqual({ mode: 'disabled' });
  });

  it('event boss は event id を保ちながら逃走と仲間化を禁止する', () => {
    const ruleset = resolveBattleRuleset({ kind: 'event', isBossBattle: true });

    expect(ruleset.id).toBe('event');
    expect(ruleset.flee).toEqual({ mode: 'blocked' });
    expect(ruleset.recruitment).toEqual({ mode: 'disabled' });
    expect(ruleset.rewards).toEqual({ mode: 'standard' });
  });

  it('明示した敵戦術だけを差し替え、他のルールを維持する', () => {
    const ruleset = resolveBattleRuleset({ kind: 'normal', enemyTactics: AGGRESSIVE_ENEMY_TACTICS });

    expect(ruleset.enemyTactics).toEqual(AGGRESSIVE_ENEMY_TACTICS);
    expect(ruleset.flee).toEqual(NORMAL_BATTLE_RULESET.flee);
    expect(ruleset.rewards).toEqual(NORMAL_BATTLE_RULESET.rewards);
  });

  it('party persistence rule から結果の保存可否を一意に決める', () => {
    expect(shouldPersistBattleResult(NORMAL_BATTLE_RULESET)).toBe(true);
    expect(shouldPersistBattleResult(TUTORIAL_BATTLE_RULESET)).toBe(false);
  });
});

describe('battle engine ruleset integration', () => {
  it('ruleset 省略時も抽出前と同じ固定 seed の敵行動列を返す', () => {
    let state = battle();
    const commands: { command: string; skillId?: string }[][] = [];

    for (let turn = 0; turn < 6; turn += 1) {
      const result = act(state, { kind: 'attack' }, D);
      commands.push(
        result.events.flatMap((event) =>
          event.t === 'act' && event.side === 'enemy'
            ? [{ command: event.command, ...(event.skillId ? { skillId: event.skillId } : {}) }]
            : [],
        ),
      );
      state = result.state;
    }

    expect(commands).toEqual([
      [{ command: 'defend' }],
      [{ command: 'attack' }],
      [{ command: 'attack' }],
      [{ command: 'skill', skillId: 'sk-happa-tobashi' }],
      [{ command: 'attack' }],
      [{ command: 'attack' }],
    ]);
  });

  it('差し替えた戦術を engine の敵行動へ使う', () => {
    const ruleset = resolveBattleRuleset({
      kind: 'normal',
      enemyTactics: {
        ...AGGRESSIVE_ENEMY_TACTICS,
        weights: { attack: 0, skill: 1, defend: 0 },
      },
    });

    const result = act(battle(ruleset), { kind: 'attack' }, D);

    expect(result.events).toContainEqual(
      expect.objectContaining({ t: 'act', side: 'enemy', command: 'skill' }),
    );
  });

  it('blocked flee は非ボス敵でも失敗し、ターンを進めない', () => {
    const state = battle(TUTORIAL_BATTLE_RULESET);

    const result = act(state, { kind: 'flee' }, D);

    expect(result.events).toEqual([{ t: 'fleeAttempt', success: false, chance: 0 }]);
    expect(result.state.turn).toBe(1);
    expect(result.state.outcome).toBe('ongoing');
  });

  it('disabled recruitment は贈り物を消費せず、ターンを進めない', () => {
    const state = battle(TUTORIAL_BATTLE_RULESET);
    state.enemy.hp = 1;

    const result = act(state, { kind: 'recruit', result: answer, itemId: 'aomori-ringo' }, D);

    expect(result.events).toEqual([{ t: 'recruitAttempt', targetId: 'enemy', success: false, chance: 0 }]);
    expect(result.state.ally.items['aomori-ringo']).toBe(1);
    expect(result.state.turn).toBe(1);
  });

  it('rewards none は勝利しても XP・gold・drop・仲間候補を返さない', () => {
    const state = battle(TUTORIAL_BATTLE_RULESET);
    state.enemy.hp = 1;

    const result = act(state, { kind: 'attack' }, D);
    const victory = result.events.find((event) => event.t === 'victory');

    expect(victory).toMatchObject({
      t: 'victory',
      xp: 0,
      gold: 0,
      drops: [],
      recruitOffer: false,
    });
  });

  it('HUD と仲間化判定も canonical ruleset の禁止設定を使う', () => {
    const state = battle(TUTORIAL_BATTLE_RULESET);
    state.enemy.hp = 1;
    state.ally.items['common-musubi-dama'] = 1;
    const musubiDama = C.items.get('common-musubi-dama')!;

    expect(battleItemAvailability(state, musubiDama, C)).toMatchObject({ disabled: true });
    expect(
      canRecruitByCommand({
        state,
        enemy: C.monsters.get(state.enemy.refId)!,
        storyCompanion: true,
        hpThreshold: C.settings.recruitHpThreshold,
      }),
    ).toBe(false);
    expect(
      buildCommandOptions({
        state,
        deps: D,
        context: { storyCompanionUnlocked: true, questionSkillKeys: new Set(), phase: 'selection' },
      }).find((command) => command.kind === 'flee'),
    ).toMatchObject({ kind: 'flee', disabled: true, blockReason: 'boss-flee-blocked' });
  });

  it('明示 ruleset と旧 boss 表示 flag が食い違っても recruitment は ruleset を正とする', () => {
    const state = battle(NORMAL_BATTLE_RULESET);
    state.isBossBattle = true;
    state.enemy.isBoss = true;
    state.enemy.hp = 1;
    state.ally.items['common-musubi-dama'] = 1;
    const item = C.items.get('common-musubi-dama')!;

    expect(battleItemAvailability(state, item, C).disabled).toBe(false);
    const result = act(
      state,
      {
        kind: 'item',
        itemId: item.id,
        result: answer,
        timeLimitScale: 1,
      },
      D,
    );

    expect(result.state.ally.items[item.id]).toBe(0);
    expect(result.events).toContainEqual(
      expect.objectContaining({ t: 'itemUsed', itemId: item.id, targetId: 'enemy' }),
    );
  });
});
