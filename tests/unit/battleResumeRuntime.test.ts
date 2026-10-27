import { describe, expect, it, vi } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { makeMonster } from '../../src/core/battle/factory';
import { partyFromGameState } from '../../src/core/battle/setup';
import type { BattleSummary } from '../../src/core/progression/battleResult';
import { createNewGame } from '../../src/core/state/newGame';
import type { GameState } from '../../src/core/state/schema';
import { BattleResumeRuntime, runCheckpointedBattleCommand } from '../../src/scenes/battle/resumeRuntime';
import { content } from './helpers';

describe('BattleResumeRuntime', () => {
  it('演出中はresolved-commandを維持し、完了後だけsafe checkpointを書く', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    const enemy = c.monsters.get('aomori-nebutan')!;
    const before = createBattle(
      {
        ally: partyFromGameState(game, c),
        enemy: makeMonster(enemy, 2, 'enemy'),
        seed: 'battle-seed',
      },
      {
        settings: c.settings,
        elements: c.elements,
        skills: c.skills,
        items: c.items,
        monsters: c.monsters,
      },
    );
    const after = { ...before, turn: before.turn + 1 };
    const calls: string[] = [];
    let finishPresentation!: () => void;
    const presentation = new Promise<void>((resolve) => {
      finishPresentation = resolve;
    });

    const running = runCheckpointedBattleCommand({
      command: { kind: 'attack' },
      persistResolved: true,
      checkpointResolved: async () => void calls.push('resolved'),
      resolve: () => {
        calls.push('act');
        return { state: after, events: [{ t: 'turnStart', turn: 2 }] };
      },
      present: async () => {
        calls.push('present');
        await presentation;
      },
      checkpointSafe: async () => void calls.push('safe'),
    });

    await vi.waitFor(() => expect(calls).toEqual(['resolved', 'act', 'present']));
    finishPresentation();
    await expect(running).resolves.toBe(after);
    expect(calls).toEqual(['resolved', 'act', 'present', 'safe']);
  });

  it('settlement保存失敗後に同じstateを再試行し、報酬を増やさない', async () => {
    const c = await content();
    let current = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    current.seed = 'runtime-seed';
    let fail = false;
    const runtime = new BattleResumeRuntime(() => current, {
      commit: async (state) => {
        current = state;
        if (fail) throw new Error('storage full');
      },
    });
    const enemy = c.monsters.get('aomori-nebutan')!;
    const battleState = createBattle(
      {
        ally: partyFromGameState(current, c),
        enemy: makeMonster(enemy, 2, 'enemy'),
        seed: 'battle-seed',
      },
      {
        settings: c.settings,
        elements: c.elements,
        skills: c.skills,
        items: c.items,
        monsters: c.monsters,
      },
    );
    const initialized = await runtime.initialize({
      launch: {
        enemyId: enemy.id,
        level: 2,
        zone: 'field',
        encounterId: 'field:1',
        encounterSource: { type: 'random' },
      },
      battleState,
      questionSeed: 'question-seed',
      questionRngState: null,
      perfectBySubject: {},
    });
    battleState.outcome = 'victory';
    await runtime.checkpoint(initialized.snapshot.battleId, {
      battleState,
      questionRngState: null,
      perfectBySubject: {},
      phase: { kind: 'awaiting-result' },
    });
    const summary: BattleSummary = {
      outcome: 'victory',
      enemyRefId: enemy.id,
      enemyLevel: 2,
      heroHp: 20,
      heroMp: 5,
      heroMaxHp: 24,
      heroMaxMp: 6,
      xp: 10,
      gold: 20,
      drops: [],
      items: {},
      recruitAccepted: false,
      perfectBySubject: {},
    };

    fail = true;
    await expect(
      runtime.settle(initialized.snapshot.battleId, initialized.snapshot.sequence, summary, c),
    ).rejects.toThrow('storage full');
    const afterFailure = current;
    expect(afterFailure.player.gold).toBe(120);

    fail = false;
    const retried = await runtime.settle(
      initialized.snapshot.battleId,
      initialized.snapshot.sequence,
      summary,
      c,
    );

    expect(retried.applied).toBe(false);
    expect(current.player.gold).toBe(120);
    expect(current.player.xp).toBe(10);
    expect(current.battle.active?.phase.kind).toBe('settled');
  });

  it('同じencounterのactive snapshotを新規割当せず復元する', async () => {
    const c = await content();
    let current: GameState = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    const runtime = new BattleResumeRuntime(() => current, {
      commit: async (state) => void (current = state),
    });
    const enemy = c.monsters.get('aomori-nebutan')!;
    const battleState = createBattle(
      {
        ally: partyFromGameState(current, c),
        enemy: makeMonster(enemy, 2, 'enemy'),
        seed: 'battle-seed',
      },
      {
        settings: c.settings,
        elements: c.elements,
        skills: c.skills,
        items: c.items,
        monsters: c.monsters,
      },
    );
    const input = {
      launch: {
        enemyId: enemy.id,
        level: 2,
        zone: 'field' as const,
        encounterId: 'field:1',
        encounterSource: { type: 'random' as const },
      },
      battleState,
      questionSeed: 'question-seed',
      questionRngState: null,
      perfectBySubject: {},
    };

    const first = await runtime.initialize(input);
    const second = await runtime.initialize(input);

    expect(first.resumed).toBe(false);
    expect(second).toEqual({ snapshot: first.snapshot, resumed: true });
    expect(current.battle.nextSequence).toBe(2);
  });
});
