import { beforeAll, describe, expect, it } from 'vitest';
import { act, createBattle, type BattleDeps } from '../../src/core/battle/engine';
import { makeHero, makeMonster, makeParty } from '../../src/core/battle/factory';
import type { ActionResult, BattleEvent, BattleState, Combatant } from '../../src/core/battle/types';
import { content, deps } from './helpers';

let battleDeps: BattleDeps;

beforeAll(async () => {
  battleDeps = await deps();
});

const result = (score: number): ActionResult => ({ score, timeMs: 1_000, attempts: 1 });
const actionIdOf = (event: BattleEvent): unknown => (event as BattleEvent & { actionId?: unknown }).actionId;
const targetIdsOf = (event: BattleEvent): unknown =>
  (event as BattleEvent & { targetIds?: unknown }).targetIds;

const toughen = <T extends Combatant>(combatant: T): T => ({
  ...combatant,
  hp: 9_999,
  stats: { ...combatant.stats, hp: 9_999 },
});

async function setup(options: { withCompanion?: boolean; skills?: string[]; seed?: string } = {}) {
  const loaded = await content();
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
        spd: 7,
        wis: 5,
      },
      growth: { hp: 6, mp: 2, atk: 1.5, def: 1.2, spd: 1, wis: 1 },
      skills: options.skills ?? ['sk-tashizan-giri', 'sk-kanji-barrier'],
      equipment: {},
    },
    loaded.items,
    loaded.sets,
  );
  const monsters = options.withCompanion
    ? [makeMonster(loaded.monsters.get('aomori-nebutan')!, 4, 'pal')]
    : [];
  const state = createBattle(
    {
      ally: makeParty(hero, monsters, { 'aomori-ringo': 2 }),
      enemy: makeMonster(loaded.monsters.get('aomori-ringoron')!, 3, 'enemy'),
      seed: options.seed ?? 'action-causality',
    },
    battleDeps,
  );
  return {
    ...state,
    enemy: toughen(state.enemy),
    ally: {
      ...state.ally,
      hero: toughen(state.ally.hero),
      monsters: state.ally.monsters.map(toughen),
    },
  } satisfies BattleState;
}

describe('battle action causality', () => {
  it('gives every resolved actor a distinct deterministic action id and shares it with its effects', async () => {
    const state = await setup({ withCompanion: true });

    const events = act(state, { kind: 'attack' }, battleDeps).events;
    const actions = events.filter((event) => event.t === 'act');

    expect(actions).toHaveLength(3);
    expect(actions.map(actionIdOf)).toEqual(['turn:1:action:0', 'turn:1:action:1', 'turn:1:action:2']);
    for (const action of actions) {
      const actionId = actionIdOf(action);
      const effects = events.filter(
        (event) => actionIdOf(event) === actionId && (event.t === 'damage' || event.t === 'buff'),
      );
      expect(effects.length).toBeGreaterThan(0);
    }
  });

  it('puts explicit targets on act events instead of requiring the next event', async () => {
    const state = await setup();

    const events = act(
      state,
      { kind: 'skill', skillId: 'sk-tashizan-giri', result: result(1) },
      battleDeps,
    ).events;
    const heroAction = events.find((event) => event.t === 'act' && event.actorId === 'hero');

    expect(heroAction).toBeDefined();
    expect(targetIdsOf(heroAction!)).toEqual(['enemy']);
    const damage = events.find((event) => event.t === 'damage' && event.side === 'enemy');
    expect(actionIdOf(damage!)).toBe(actionIdOf(heroAction!));
  });

  it('keeps multi-target effects in one action bundle', async () => {
    const state = await setup({ withCompanion: true });

    const events = act(
      state,
      { kind: 'skill', skillId: 'sk-kanji-barrier', result: result(1) },
      battleDeps,
    ).events;
    const action = events.find((event) => event.t === 'act' && event.actorId === 'hero');
    const buffs = events.filter(
      (event): event is Extract<BattleEvent, { t: 'buff' }> => event.t === 'buff' && event.side === 'ally',
    );

    expect(targetIdsOf(action!)).toEqual(['hero', 'pal']);
    expect(buffs.map((event) => event.targetId)).toEqual(['hero', 'pal']);
    expect(new Set(buffs.map(actionIdOf))).toEqual(new Set([actionIdOf(action!)]));
  });

  it('links damage, knockout, and victory to the action that caused them', async () => {
    const state = await setup();
    state.enemy.hp = 1;

    const events = act(state, { kind: 'attack' }, battleDeps).events;
    const action = events.find((event) => event.t === 'act' && event.actorId === 'hero');
    const consequences = events.filter(
      (event) => event.t === 'damage' || event.t === 'ko' || event.t === 'victory',
    );

    expect(action).toBeDefined();
    expect(consequences.map(actionIdOf)).toEqual(consequences.map(() => actionIdOf(action!)));
    expect(consequences.map((event) => event.t)).toEqual(['damage', 'ko', 'victory']);
  });

  it('does not allocate an action id for a rejected command', async () => {
    const state = await setup({ skills: ['sk-tashizan-giri', 'sk-kuku-rush'] });

    const step = act(state, { kind: 'skill', skillId: 'sk-kuku-rush', result: result(1) }, battleDeps);

    expect(step.events).toEqual([{ t: 'gaugeShort', subject: 'sansu', need: 50, have: 0 }]);
    expect(step.events.every((event) => actionIdOf(event) === undefined)).toBe(true);
    expect(step.state.turn).toBe(1);
  });

  it('represents multiple hits without creating an ordering relationship between them', () => {
    const actionId = 'turn:3:action:1' as const;
    const hits: BattleEvent[] = [
      {
        t: 'damage',
        actionId,
        side: 'enemy',
        targetId: 'enemy',
        amount: 4,
        critical: false,
        elementMult: 1,
        weakness: false,
        scoreBand: null,
        comboMult: 1,
      },
      {
        t: 'damage',
        actionId,
        side: 'enemy',
        targetId: 'enemy',
        amount: 5,
        critical: false,
        elementMult: 1,
        weakness: false,
        scoreBand: null,
        comboMult: 1,
      },
    ];

    expect(new Set(hits.map(actionIdOf))).toEqual(new Set([actionId]));
    expect(hits.map((event) => (event.t === 'damage' ? event.amount : 0))).toEqual([4, 5]);
  });

  it('replays action ids without consuming extra randomness', async () => {
    const first = await setup({ withCompanion: true, seed: 'deterministic-actions' });
    const second = await setup({ withCompanion: true, seed: 'deterministic-actions' });

    const firstStep = act(first, { kind: 'attack' }, battleDeps);
    const secondStep = act(second, { kind: 'attack' }, battleDeps);

    expect(firstStep.events).toEqual(secondStep.events);
    expect(firstStep.state.rngState).toEqual(secondStep.state.rngState);
    expect(firstStep.events.filter((event) => actionIdOf(event)).length).toBeGreaterThan(0);
  });
});
