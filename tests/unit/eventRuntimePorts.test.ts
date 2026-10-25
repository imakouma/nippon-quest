import { describe, expect, it, vi } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { createEffectScope } from '../../src/core/lifecycle/effectScope';
import type { GameState } from '../../src/core/state/schema';
import { createEventRuntimePorts } from '../../src/scenes/overworld/eventRuntimePorts';
import type { EncounterLifecycle } from '../../src/scenes/overworld/encounterLifecycle';
import type { FieldFlowContext } from '../../src/scenes/overworld/fieldFlowRuntime';
import type { MapTransitionPorts } from '../../src/scenes/overworld/mapTransitionPipeline';

function harness() {
  let game: GameState = createNewGame({ name: 'ハル', grade: 1 }, 0);
  const controller = new AbortController();
  const scope = createEffectScope({ signal: controller.signal });
  const flow: FieldFlowContext = {
    signal: scope.signal,
    scope,
    throwIfCancelled: () => scope.signal.throwIfAborted(),
  };
  const encounter: EncounterLifecycle = {
    active: null,
    start: vi.fn(async () => true),
    startInFlow: vi.fn(async () => ({ outcome: 'victory' as const, goldLost: 0 })),
    finish: vi.fn(async () => undefined),
    cancel: vi.fn(),
  };
  const transitions: MapTransitionPorts = {
    closeTransientUi: vi.fn(),
    fadeOut: vi.fn(async () => undefined),
    restart: vi.fn(),
  };
  const showReward = vi.fn(async () => undefined);
  const onFlagSet = vi.fn();
  const movement = vi.fn(async () => undefined);
  const ports = createEventRuntimePorts({
    flow,
    encounter,
    transitions,
    eventId: 'aomori-ev-scripted',
    stamp: 'aomori:ringo',
    getGame: () => game,
    setGame: (next) => {
      game = next;
    },
    dialogue: vi.fn(async () => undefined),
    choose: vi.fn(async () => 1),
    question: vi.fn(async () => 0.75),
    movement,
    showReward,
    onFlagSet,
    nextEncounterId: () => 'event:1',
    battleData: (command) => ({
      enemyId: command.enemyId,
      level: command.level ?? 3,
      zone: 'field',
      isBoss: command.isBoss,
    }),
  });
  return {
    controller,
    encounter,
    flow,
    get game() {
      return game;
    },
    onFlagSet,
    movement,
    ports,
    showReward,
    transitions,
  };
}

describe('event runtime scene ports', () => {
  it('dialogue、choice、question を既存 UI port へ委譲する', async () => {
    const { ports } = harness();
    const lines = [{ text: 'こんにちは。' }];

    await ports.dialogue(lines);
    await expect(ports.choose(lines, ['はい', 'いいえ'])).resolves.toBe(1);
    await expect(ports.question({ subject: 'sansu', gradeRange: [1, 2] })).resolves.toBe(0.75);
  });

  it('既存 progression 関数で score 報酬と event flag/stamp を反映する', async () => {
    const h = harness();

    await h.ports.reward([{ min: 0, reward: { gold: 12 } }], 0);
    h.ports.setFlag('aomori-ev-scripted');

    expect(h.game.player.gold).toBe(112);
    expect(h.game.progress.eventsDone).toContain('aomori-ev-scripted');
    expect(h.game.dex.motifs).toContain('aomori:ringo');
    expect(h.showReward).toHaveBeenCalledWith([{ kind: 'gold', n: 12 }]);
    expect(h.onFlagSet).toHaveBeenCalledWith('aomori-ev-scripted');
  });

  it('battle は取得済み flow で encounter lifecycle を一度だけ実行して結果を返す', async () => {
    const h = harness();
    const command = { type: 'battle' as const, key: 'fight', enemyId: 'aomori-ringoron', level: 4 };

    await expect(h.ports.battle(command)).resolves.toBe('victory');
    expect(h.encounter.startInFlow).toHaveBeenCalledWith(
      {
        id: 'event:1',
        battle: { enemyId: 'aomori-ringoron', level: 4, zone: 'field', isBoss: undefined },
        source: { type: 'script' },
      },
      h.flow,
    );
  });

  it('warp は取得済み signal で map transition pipeline を一度だけ実行する', async () => {
    const h = harness();

    await h.ports.warp({ type: 'warp', map: 'aomori-town', spawn: 'door_field' });

    expect(h.transitions.closeTransientUi).toHaveBeenCalledTimes(1);
    expect(h.transitions.fadeOut).toHaveBeenCalledWith(h.flow.signal);
    expect(h.transitions.restart).toHaveBeenCalledWith({
      targetMap: 'aomori-town',
      spawnName: 'door_field',
      reason: 'script',
    });
  });

  it('movement は取得済み signal で production movement port の完了を待つ', async () => {
    const h = harness();
    const command = {
      type: 'movement' as const,
      objectId: 'npc-guide',
      commands: [{ type: 'walk' as const, direction: 'up' as const }],
    };

    await h.ports.movement(command, h.controller.signal);

    expect(h.movement).toHaveBeenCalledWith(command, h.controller.signal);
  });
});
