import { beforeAll, describe, expect, it } from 'vitest';
import {
  battleCommandRef,
  evaluateBattleCommand,
  type BattleCommandEvaluationContext,
} from '../../src/core/battle/commandEvaluation';
import { createBattle, type BattleDeps } from '../../src/core/battle/engine';
import { makeHero, makeMonster, makeParty } from '../../src/core/battle/factory';
import type { BattleState } from '../../src/core/battle/types';
import { content, deps } from './helpers';

let D: BattleDeps;

beforeAll(async () => {
  D = await deps();
});

async function setup(withMonster = true): Promise<BattleState> {
  const c = await content();
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
      skills: ['sk-tashizan-giri', 'sk-kuku-rush'],
      equipment: {},
    },
    c.items,
    c.sets,
  );
  const enemy = makeMonster(c.monsters.get('aomori-ringoron')!, 3, 'enemy');
  const monsters = withMonster ? [makeMonster(c.monsters.get('aomori-nebutan')!, 4, 'pal')] : [];
  const party = makeParty(hero, monsters, {
    'aomori-ringo': 2,
    'common-musubi-dama': 1,
  });
  return createBattle({ ally: party, enemy, seed: 'command-evaluation' }, D);
}

const context = (over: Partial<BattleCommandEvaluationContext> = {}): BattleCommandEvaluationContext => ({
  storyCompanionUnlocked: true,
  phase: 'execution',
  ...over,
});

describe('evaluateBattleCommand', () => {
  it('こうげきの敵対象とターン消費を解決し、入力を変更しない', async () => {
    const state = await setup();
    const before = structuredClone(state);

    expect(evaluateBattleCommand(state, { kind: 'attack' }, D, context())).toEqual({
      allowed: true,
      reason: null,
      actorId: state.ally.hero.id,
      resolvedTargets: [{ side: 'enemy', combatantId: state.enemy.id }],
      costs: [],
      consumesTurn: true,
    });
    expect(state).toEqual(before);
  });

  it('必殺技の使用者・対象・ゲージ消費を解決する', async () => {
    const state = await setup();
    state.player.subjectGauges.sansu = 60;

    expect(
      evaluateBattleCommand(
        state,
        { kind: 'skill', skillId: 'sk-kuku-rush', actorId: state.ally.hero.id },
        D,
        context(),
      ),
    ).toMatchObject({
      allowed: true,
      reason: null,
      actorId: state.ally.hero.id,
      resolvedTargets: [{ side: 'enemy', combatantId: state.enemy.id }],
      costs: [{ kind: 'gauge', subject: 'sansu', amount: 50 }],
      consumesTurn: true,
    });
  });

  it.each([
    ['unknown-skill', { kind: 'skill', skillId: 'no-such-skill' } as const, {}],
    [
      'question-unavailable',
      { kind: 'skill', skillId: 'sk-tashizan-giri' } as const,
      { questionSkillKeys: new Set() },
    ],
    ['insufficient-gauge', { kind: 'skill', skillId: 'sk-kuku-rush' } as const, {}],
  ])('%s を理由つきで拒否する', async (reason, ref, over) => {
    const state = await setup();
    expect(evaluateBattleCommand(state, ref, D, context(over))).toMatchObject({
      allowed: false,
      reason,
      costs: [],
      consumesTurn: false,
    });
  });

  it('倒れたオトモの必殺技を actor-unavailable として拒否する', async () => {
    const state = await setup();
    state.ally.monsters[0]!.hp = 0;
    state.companion = null;

    expect(
      evaluateBattleCommand(state, { kind: 'skill', skillId: 'sk-hinoko', actorId: 'pal' }, D, context()),
    ).toMatchObject({ allowed: false, reason: 'actor-unavailable' });
  });

  it('回復どうぐの最弱対象と所持数消費を解決する', async () => {
    const state = await setup();
    state.ally.monsters[0]!.hp = 1;

    expect(
      evaluateBattleCommand(state, { kind: 'item', itemId: 'aomori-ringo' }, D, context()),
    ).toMatchObject({
      allowed: true,
      resolvedTargets: [{ side: 'ally', combatantId: 'pal', monsterIndex: 0 }],
      costs: [{ kind: 'item', itemId: 'aomori-ringo', amount: 1 }],
      consumesTurn: true,
    });
  });

  it('効果のない回復どうぐと未解答のむすび玉を区別して拒否する', async () => {
    const state = await setup();
    expect(
      evaluateBattleCommand(state, { kind: 'item', itemId: 'aomori-ringo' }, D, context()),
    ).toMatchObject({
      allowed: false,
      reason: 'item-no-effect',
    });
    expect(
      evaluateBattleCommand(
        state,
        battleCommandRef({ kind: 'item', itemId: 'common-musubi-dama' }, false),
        D,
        context(),
      ),
    ).toMatchObject({ allowed: false, reason: 'action-result-required' });
  });

  it('交代先を解決し、現在の仲間・倒れた仲間を拒否する', async () => {
    const state = await setup();
    const c = await content();
    state.ally.monsters.push(makeMonster(c.monsters.get('aomori-ringoron')!, 3, 'pal2'));

    expect(evaluateBattleCommand(state, { kind: 'swap', monsterIndex: 1 }, D, context())).toMatchObject({
      allowed: true,
      resolvedTargets: [{ side: 'ally', combatantId: 'pal2', monsterIndex: 1 }],
    });
    expect(evaluateBattleCommand(state, { kind: 'swap', monsterIndex: 0 }, D, context())).toMatchObject({
      allowed: false,
      reason: 'already-active',
    });
    state.ally.monsters[1]!.hp = 0;
    expect(evaluateBattleCommand(state, { kind: 'swap', monsterIndex: 1 }, D, context())).toMatchObject({
      allowed: false,
      reason: 'target-defeated',
    });
  });

  it('ボス逃走をターン非消費で拒否する', async () => {
    const state = await setup();
    state.isBossBattle = true;

    expect(evaluateBattleCommand(state, { kind: 'flee' }, D, context())).toMatchObject({
      allowed: false,
      reason: 'boss-flee-blocked',
      consumesTurn: false,
    });
  });

  it('仲間化の物語解放・HP・贈り物を同じ契約で判定する', async () => {
    const state = await setup();
    expect(
      evaluateBattleCommand(state, { kind: 'recruit' }, D, context({ storyCompanionUnlocked: false })),
    ).toMatchObject({ allowed: false, reason: 'recruit-locked' });
    expect(evaluateBattleCommand(state, { kind: 'recruit' }, D, context())).toMatchObject({
      allowed: false,
      reason: 'enemy-too-healthy',
    });
    expect(
      evaluateBattleCommand(state, { kind: 'recruit', itemId: 'not-the-gift' }, D, context()),
    ).toMatchObject({ allowed: false, reason: 'invalid-recruit-gift' });
    expect(
      evaluateBattleCommand(state, { kind: 'recruit', itemId: 'aomori-ringo' }, D, context()),
    ).toMatchObject({
      allowed: true,
      resolvedTargets: [{ side: 'enemy', combatantId: state.enemy.id }],
      costs: [{ kind: 'item', itemId: 'aomori-ringo', amount: 1 }],
    });
  });

  it('戦闘終了後と主人公行動不能を拒否し、wait だけは進められる', async () => {
    const state = await setup();
    state.ally.hero.hp = 0;
    expect(evaluateBattleCommand(state, { kind: 'attack' }, D, context())).toMatchObject({
      allowed: false,
      reason: 'hero-unavailable',
    });
    expect(evaluateBattleCommand(state, { kind: 'wait' }, D, context())).toMatchObject({
      allowed: true,
      consumesTurn: true,
    });
    state.outcome = 'victory';
    expect(evaluateBattleCommand(state, { kind: 'wait' }, D, context())).toMatchObject({
      allowed: false,
      reason: 'battle-over',
    });
  });
});
