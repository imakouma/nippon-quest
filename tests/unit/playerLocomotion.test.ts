import { describe, expect, it } from 'vitest';
import {
  advanceLocomotion,
  createLocomotionState,
  dispatchLocomotion,
  type LocomotionState,
} from '../../src/core/world/playerLocomotion';
import { locomotionCommandFromDecision } from '../../src/scenes/overworld/playerLocomotionAdapter';

const step = {
  type: 'step',
  direction: 'right',
  from: { x: 1, y: 2 },
  to: { x: 2, y: 2 },
} as const;

const expectPhase = <T extends LocomotionState['phase']>(
  state: LocomotionState,
  phase: T,
): Extract<LocomotionState, { phase: T }> => {
  expect(state.phase).toBe(phase);
  return state as Extract<LocomotionState, { phase: T }>;
};

describe('player locomotion runtime', () => {
  it('turns for 80 ms before held input can start a step', () => {
    let result = dispatchLocomotion(createLocomotionState('down'), step);
    expect(expectPhase(result.state, 'turning')).toMatchObject({ facing: 'right', elapsedMs: 0 });
    expect(result.events).toEqual([]);

    result = advanceLocomotion(result.state, 79);
    expect(expectPhase(result.state, 'turning').elapsedMs).toBe(79);
    expect(result.events).toEqual([]);

    result = advanceLocomotion(result.state, 1);
    expect(result.state).toEqual({ phase: 'idle', facing: 'right', leadFoot: 'a' });
    expect(result.events).toEqual([{ type: 'turned', direction: 'right' }]);

    result = dispatchLocomotion(result.state, step);
    expect(expectPhase(result.state, 'stepping')).toMatchObject({
      facing: 'right',
      from: { x: 1, y: 2 },
      to: { x: 2, y: 2 },
      progress: 0,
      leadFoot: 'a',
    });
    expect(result.events).toEqual([
      {
        type: 'stepStarted',
        direction: 'right',
        from: { x: 1, y: 2 },
        to: { x: 2, y: 2 },
        leadFoot: 'a',
      },
    ]);
  });

  it('completes one 160 ms step with one foot plant and one completion', () => {
    const started = dispatchLocomotion(createLocomotionState('right'), step);
    const halfway = advanceLocomotion(started.state, 80);
    expect(expectPhase(halfway.state, 'stepping').progress).toBe(0.5);
    expect(halfway.events).toEqual([]);

    const completed = advanceLocomotion(halfway.state, 80);
    expect(completed.state).toEqual({ phase: 'idle', facing: 'right', leadFoot: 'b' });
    expect(completed.events).toEqual([
      {
        type: 'footPlanted',
        direction: 'right',
        at: { x: 2, y: 2 },
        leadFoot: 'a',
      },
      {
        type: 'stepCompleted',
        direction: 'right',
        from: { x: 1, y: 2 },
        to: { x: 2, y: 2 },
        leadFoot: 'a',
      },
    ]);
  });

  it('alternates the lead foot after every completed step', () => {
    const first = advanceLocomotion(dispatchLocomotion(createLocomotionState('right'), step).state, 160);
    const secondCommand = {
      ...step,
      from: { x: 2, y: 2 },
      to: { x: 3, y: 2 },
    } as const;
    const secondStarted = dispatchLocomotion(first.state, secondCommand);
    expect(expectPhase(secondStarted.state, 'stepping').leadFoot).toBe('b');

    const second = advanceLocomotion(secondStarted.state, 160);
    expect(second.state).toEqual({ phase: 'idle', facing: 'right', leadFoot: 'a' });
    expect(second.events.map((event) => ('leadFoot' in event ? event.leadFoot : null))).toEqual(['b', 'b']);
  });

  it('bumps for 100 ms without changing logical coordinates', () => {
    let result = dispatchLocomotion(createLocomotionState('up'), {
      type: 'bump',
      direction: 'up',
    });
    expect(expectPhase(result.state, 'bumping')).toMatchObject({ facing: 'up', progress: 0 });

    result = advanceLocomotion(result.state, 99);
    expect(expectPhase(result.state, 'bumping').progress).toBe(0.99);
    expect(result.events).toEqual([]);

    result = advanceLocomotion(result.state, 1);
    expect(result.state).toEqual({ phase: 'idle', facing: 'up', leadFoot: 'a' });
    expect(result.events).toEqual([{ type: 'bumped', direction: 'up' }]);
  });

  it('rejects player movement while frozen or scripted and resumes at idle', () => {
    const stepping = dispatchLocomotion(createLocomotionState('right'), step).state;
    const frozen = dispatchLocomotion(stepping, { type: 'freeze' });
    expect(frozen.state).toEqual({ phase: 'frozen', facing: 'right', leadFoot: 'a' });
    expect(dispatchLocomotion(frozen.state, step)).toEqual({ state: frozen.state, events: [] });
    expect(dispatchLocomotion(frozen.state, { type: 'resume' }).state).toEqual({
      phase: 'idle',
      facing: 'right',
      leadFoot: 'a',
    });

    const scripted = dispatchLocomotion(createLocomotionState('down'), {
      type: 'script',
      facing: 'left',
    });
    expect(scripted.state).toEqual({ phase: 'scripted', facing: 'left', leadFoot: 'a' });
    expect(dispatchLocomotion(scripted.state, step)).toEqual({ state: scripted.state, events: [] });
    expect(dispatchLocomotion(scripted.state, { type: 'resume' }).state).toEqual({
      phase: 'idle',
      facing: 'left',
      leadFoot: 'a',
    });
  });

  it('clamps progress and emits completion events only once for a large frame delta', () => {
    const started = dispatchLocomotion(createLocomotionState('right'), step);
    const completed = advanceLocomotion(started.state, 10_000);
    expect(completed.state.phase).toBe('idle');
    expect(completed.events.map((event) => event.type)).toEqual(['footPlanted', 'stepCompleted']);

    const after = advanceLocomotion(completed.state, 10_000);
    expect(after.state).toBe(completed.state);
    expect(after.events).toEqual([]);
  });
});

describe('player locomotion adapter', () => {
  const from = [1, 2] as const;

  it('maps existing movement decisions without changing their priority contract', () => {
    expect(locomotionCommandFromDecision('right', from, { kind: 'move', x: 2, y: 2 })).toEqual(step);
    expect(locomotionCommandFromDecision('up', from, { kind: 'blocked' })).toEqual({
      type: 'bump',
      direction: 'up',
    });
    expect(locomotionCommandFromDecision('left', from, { kind: 'stand' })).toEqual({
      type: 'bump',
      direction: 'left',
    });
  });

  it.each([
    { kind: 'midboss' } as const,
    { kind: 'regionBoss', boss: 'region' } as const,
    { kind: 'lockedGate', gate: 'gate' } as const,
    { kind: 'areaBoss' } as const,
    { kind: 'lastBoss' } as const,
  ])('leaves $kind orchestration to Overworld', (decision) => {
    expect(locomotionCommandFromDecision('down', from, decision)).toBeNull();
  });
});
