import { describe, expect, it, vi } from 'vitest';
import type { EventRuntimePorts } from '../../src/core/events/contracts';
import { createFieldFlowRuntime } from '../../src/scenes/overworld/fieldFlowRuntime';
import {
  executeFieldInteractionDecision,
  type FieldInteractionExecutionPorts,
} from '../../src/scenes/overworld/fieldInteractionRuntime';
import type { FieldInteractionDecision } from '../../src/scenes/overworld/fieldInteractionRouter';

function eventPorts(): EventRuntimePorts {
  return {
    dialogue: vi.fn(async () => undefined),
    choose: vi.fn(async () => 0),
    question: vi.fn(async () => 0),
    reward: vi.fn(async () => undefined),
    setFlag: vi.fn(),
    battle: vi.fn(async () => 'victory' as const),
    warp: vi.fn(async () => undefined),
    movement: vi.fn(async () => undefined),
  };
}

function ports(): FieldInteractionExecutionPorts {
  return {
    flow: createFieldFlowRuntime({
      lockInput: vi.fn(),
      releaseInput: vi.fn(),
      cleanupTransientUi: vi.fn(),
      reportError: vi.fn(),
    }),
    mapTransition: {
      closeTransientUi: vi.fn(),
      fadeOut: vi.fn(async () => undefined),
      restart: vi.fn(),
    },
    eventCommands: { ports: eventPorts() },
    dispatch: vi.fn(async () => undefined),
  };
}

describe('executeFieldInteractionDecision', () => {
  it('noneは何も実行しない', async () => {
    const runtimePorts = ports();
    expect(await executeFieldInteractionDecision({ kind: 'none', reason: 'no-target' }, runtimePorts)).toBe(
      false,
    );
    expect(runtimePorts.dispatch).not.toHaveBeenCalled();
  });

  it('map transitionをfield flowとmap transition pipelineへ委譲する', async () => {
    const runtimePorts = ports();
    const request = { targetMap: 'aomori-town', spawnName: 'spawn', reason: 'door' } as const;
    const decision: FieldInteractionDecision = {
      kind: 'action',
      candidate: {
        id: 'door',
        kind: 'map-transition',
        activation: 'underfoot',
        position: { x: 1, y: 1 },
        request,
      },
    };

    expect(await executeFieldInteractionDecision(decision, runtimePorts)).toBe(true);
    expect(runtimePorts.mapTransition.restart).toHaveBeenCalledWith(request);
    expect(runtimePorts.dispatch).not.toHaveBeenCalled();
  });

  it('別のfield flowが実行中ならtransition副作用を始めない', async () => {
    const runtimePorts = ports();
    const beforeMapTransition = vi.fn();
    runtimePorts.beforeMapTransition = beforeMapTransition;
    let release!: () => void;
    const active = runtimePorts.flow.run('active', () => new Promise<void>((resolve) => (release = resolve)));
    const decision: FieldInteractionDecision = {
      kind: 'action',
      candidate: {
        id: 'door',
        kind: 'map-transition',
        activation: 'underfoot',
        position: { x: 1, y: 1 },
        request: { targetMap: 'aomori-town', reason: 'door' },
      },
    };

    expect(await executeFieldInteractionDecision(decision, runtimePorts)).toBe(false);
    expect(beforeMapTransition).not.toHaveBeenCalled();
    expect(runtimePorts.mapTransition.restart).not.toHaveBeenCalled();
    release();
    await active;
  });

  it('event commandsをfield flowとevent command runtimeへ委譲する', async () => {
    const runtimePorts = ports();
    const decision: FieldInteractionDecision = {
      kind: 'action',
      candidate: {
        id: 'story',
        kind: 'event-command',
        activation: 'underfoot',
        position: { x: 1, y: 1 },
        commands: [{ type: 'dialogue', lines: [{ text: 'こんにちは。' }] }],
      },
    };

    expect(await executeFieldInteractionDecision(decision, runtimePorts)).toBe(true);
    expect(runtimePorts.eventCommands?.ports.dialogue).toHaveBeenCalledWith([{ text: 'こんにちは。' }]);
    expect(runtimePorts.dispatch).not.toHaveBeenCalled();
  });

  it('Scene固有候補は一度だけdispatchする', async () => {
    const runtimePorts = ports();
    const decision: FieldInteractionDecision = {
      kind: 'action',
      candidate: { id: 'npc', kind: 'npc', activation: 'front', position: { x: 1, y: 0 } },
    };

    expect(await executeFieldInteractionDecision(decision, runtimePorts)).toBe(true);
    expect(runtimePorts.dispatch).toHaveBeenCalledTimes(1);
    expect(runtimePorts.dispatch).toHaveBeenCalledWith(decision.candidate);
  });
});
