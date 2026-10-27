import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { makeMonster } from '../../src/core/battle/factory';
import { TUTORIAL_BATTLE_RULESET } from '../../src/core/battle/ruleset';
import { partyFromGameState } from '../../src/core/battle/setup';
import { createRng } from '../../src/core/rng';
import {
  beginBattleResume,
  checkpointBattleResume,
  discardBattleResume,
} from '../../src/core/state/battleResume';
import { createNewGame } from '../../src/core/state/newGame';
import { gameStateSchema } from '../../src/core/state/schema';
import { content } from './helpers';

async function battleFixture() {
  const c = await content();
  const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
  game.seed = 'resume-seed';
  const enemy = c.monsters.get('aomori-nebutan')!;
  const deps = {
    settings: c.settings,
    elements: c.elements,
    skills: c.skills,
    items: c.items,
    monsters: c.monsters,
  };
  const battle = createBattle(
    {
      ally: partyFromGameState(game, c),
      enemy: makeMonster(enemy, 2, 'enemy'),
      seed: 'battle-seed',
    },
    deps,
  );
  battle.log.push({ t: 'turnStart', turn: 1 });
  const questionRng = createRng('question-seed');
  questionRng.next();
  return { game, battle, questionRngState: questionRng.state() };
}

describe('battle resume snapshot', () => {
  it('永続sequenceを割り当て、表示履歴を除いたcommand境界を保存する', async () => {
    const { game, battle, questionRngState } = await battleFixture();

    const started = beginBattleResume(game, {
      launch: {
        enemyId: 'aomori-nebutan',
        level: 2,
        zone: 'field',
        encounterId: 'temporary-field-id',
        encounterSource: { type: 'random' },
      },
      battleState: battle,
      questionSeed: 'question-seed',
      questionRngState,
      perfectBySubject: {},
    });

    expect(started.snapshot).toMatchObject({
      formatVersion: 1,
      battleId: 'resume-seed.battle.1',
      sequence: 1,
      phase: { kind: 'awaiting-command' },
    });
    expect(started.snapshot.launch.encounterId).toBe('temporary-field-id');
    expect(started.snapshot.battleState.log).toEqual([]);
    expect(started.state.battle.nextSequence).toBe(2);
    expect(started.state.battle.active).toEqual(started.snapshot);
    expect(game.battle).toEqual({ nextSequence: 1, finalizedThrough: 0, active: null });
    expect(gameStateSchema.safeParse(started.state).success).toBe(true);
  });

  it('resolved commandをact前stateとともに保存し、Tween後だけ次のstateへ進める', async () => {
    const { game, battle, questionRngState } = await battleFixture();
    const started = beginBattleResume(game, {
      launch: {
        enemyId: 'aomori-nebutan',
        level: 2,
        zone: 'field',
        encounterId: 'temporary-field-id',
        encounterSource: { type: 'random' },
      },
      battleState: battle,
      questionSeed: 'question-seed',
      questionRngState,
      perfectBySubject: {},
    });
    const resolved = checkpointBattleResume(started.state, started.snapshot.battleId, {
      battleState: battle,
      questionRngState,
      perfectBySubject: { sansu: 1 },
      phase: {
        kind: 'resolved-command',
        command: {
          kind: 'skill',
          skillId: 'sk-tashizan-giri',
          result: { score: 1, timeMs: 500, attempts: 1 },
        },
      },
    });

    expect(resolved.battle.active?.phase).toMatchObject({
      kind: 'resolved-command',
      command: { kind: 'skill', skillId: 'sk-tashizan-giri' },
    });
    expect(resolved.battle.active?.battleState).toEqual(started.snapshot.battleState);

    const afterTween = structuredClone(battle);
    afterTween.turn = 2;
    const safe = checkpointBattleResume(resolved, started.snapshot.battleId, {
      battleState: afterTween,
      questionRngState,
      perfectBySubject: { sansu: 1 },
      phase: { kind: 'awaiting-command' },
    });
    expect(safe.battle.active?.battleState.turn).toBe(2);
    expect(safe.battle.active?.phase).toEqual({ kind: 'awaiting-command' });
  });

  it('異なるbattleIdの遅延更新を無視し、安全な破棄でsequenceを確定する', async () => {
    const { game, battle, questionRngState } = await battleFixture();
    const started = beginBattleResume(game, {
      launch: {
        enemyId: 'aomori-nebutan',
        level: 2,
        zone: 'field',
        encounterId: 'temporary-field-id',
        encounterSource: { type: 'random' },
      },
      battleState: battle,
      questionSeed: 'question-seed',
      questionRngState,
      perfectBySubject: {},
    });

    expect(
      checkpointBattleResume(started.state, 'stale.battle.1', {
        battleState: { ...battle, turn: 99 },
        questionRngState,
        perfectBySubject: {},
        phase: { kind: 'awaiting-command' },
      }),
    ).toBe(started.state);

    const discarded = discardBattleResume(started.state, started.snapshot.battleId);
    expect(discarded.battle).toEqual({ nextSequence: 2, finalizedThrough: 1, active: null });
  });

  it('result境界で報酬eventと加入判断をround-tripする', async () => {
    const { game, battle, questionRngState } = await battleFixture();
    const started = beginBattleResume(game, {
      launch: {
        enemyId: 'aomori-nebutan',
        level: 2,
        zone: 'field',
        encounterId: 'temporary-field-id',
        encounterSource: { type: 'random' },
      },
      battleState: battle,
      questionSeed: 'question-seed',
      questionRngState,
      perfectBySubject: {},
    });
    const terminal = { ...battle, outcome: 'victory' as const };
    const result = checkpointBattleResume(started.state, started.snapshot.battleId, {
      battleState: terminal,
      questionRngState,
      perfectBySubject: { sansu: 2 },
      phase: {
        kind: 'awaiting-result',
        victory: {
          t: 'victory',
          xp: 12,
          gold: 8,
          drops: ['item-apple'],
          recruitOffer: true,
          bonus: 1.2,
          maxCombo: 3,
        },
        recruitAccepted: true,
      },
    });

    const parsed = gameStateSchema.parse(structuredClone(result));
    expect(parsed.battle.active?.phase).toEqual(result.battle.active?.phase);
  });

  it('壊れたactive snapshotだけをnullへ救済する', async () => {
    const { game } = await battleFixture();
    const parsed = gameStateSchema.parse({
      ...game,
      battle: {
        nextSequence: 8,
        finalizedThrough: 6,
        active: { battleId: 'broken', battleState: { turn: Number.NaN } },
      },
    });

    expect(parsed.battle).toEqual({ nextSequence: 8, finalizedThrough: 6, active: null });
  });

  it('rulesetとscripted起動情報を保存後も維持する', async () => {
    const { game, battle, questionRngState } = await battleFixture();
    battle.ruleset = TUTORIAL_BATTLE_RULESET;
    const query = { subject: 'sansu' as const, gradeRange: [2, 3] as const };
    const started = beginBattleResume(game, {
      launch: {
        enemyId: 'aomori-nebutan',
        level: 2,
        zone: 'field',
        encounterId: 'tutorial-id',
        encounterSource: { type: 'script' },
        kind: 'tutorial',
        party: battle.ally,
        scriptedQuestions: [query],
      },
      battleState: battle,
      questionSeed: 'question-seed',
      questionRngState,
      perfectBySubject: {},
    });

    const parsed = gameStateSchema.parse(structuredClone(started.state));
    expect(parsed.battle.active?.battleState.ruleset).toEqual(TUTORIAL_BATTLE_RULESET);
    expect(parsed.battle.active?.launch).toMatchObject({
      kind: 'tutorial',
      scriptedQuestions: [query],
    });
  });
});
