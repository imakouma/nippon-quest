import { describe, expect, it, vi } from 'vitest';
import {
  resolveContextAction,
  type ContextActionInput,
  type ContextActionTile,
} from '../../src/scenes/overworld/contextAction';
import { FieldContextActions } from '../../src/scenes/overworld/fieldContextActions';

const idle = {
  moving: false,
  turning: false,
  bumping: false,
  busy: false,
  inBattle: false,
  overlayOwnsInput: false,
};

function input(overrides: Partial<ContextActionInput> = {}): ContextActionInput {
  return { state: idle, front: {}, current: {}, surrounding: [], ...overrides };
}

function tile(overrides: ContextActionTile = {}): ContextActionTile {
  return overrides;
}

describe('resolveContextAction', () => {
  it('keeps the current boss priority before nearby interactions', () => {
    const midBoss = vi.fn();
    const regionBoss = vi.fn();
    const areaBoss = vi.fn();
    const lastBoss = vi.fn();
    const npc = vi.fn();

    const action = resolveContextAction(
      input({
        bosses: { midBoss, regionBoss, areaBoss, lastBoss },
        front: tile({ npc }),
      }),
    );

    expect(action).toEqual({ kind: 'talk', onActivate: midBoss });
  });

  it.each([
    ['region boss', { regionBoss: vi.fn(), areaBoss: vi.fn(), lastBoss: vi.fn() }],
    ['area boss', { areaBoss: vi.fn(), lastBoss: vi.fn() }],
    ['last boss', { lastBoss: vi.fn() }],
  ])('falls through to the next %s target', (_name, bosses) => {
    const action = resolveContextAction(input({ bosses }));

    expect(action).toEqual({ kind: 'talk', onActivate: Object.values(bosses)[0] });
  });

  it('checks each nearby tile in order and prefers NPC, chest, then inspectable object', () => {
    const fartherNpc = vi.fn();
    const firstInspect = vi.fn();
    const firstChest = vi.fn();
    const firstNpc = vi.fn();

    const action = resolveContextAction(
      input({
        front: tile({
          npc: firstNpc,
          chest: { opened: false, onActivate: firstChest },
          inspect: firstInspect,
        }),
        current: tile({ npc: fartherNpc }),
      }),
    );

    expect(action).toEqual({ kind: 'talk', onActivate: firstNpc });
  });

  it('shows open for an unopened chest before inspect on the same tile', () => {
    const open = vi.fn();
    const inspect = vi.fn();

    expect(
      resolveContextAction(input({ front: tile({ chest: { opened: false, onActivate: open }, inspect }) })),
    ).toEqual({ kind: 'open', onActivate: open });
  });

  it('ignores an opened chest so another valid target can be inspected', () => {
    const inspect = vi.fn();

    expect(
      resolveContextAction(input({ front: tile({ chest: { opened: true, onActivate: vi.fn() }, inspect }) })),
    ).toEqual({ kind: 'inspect', onActivate: inspect });
  });

  it('keeps front, current, then surrounding tile priority', () => {
    const currentInspect = vi.fn();
    const surroundingNpc = vi.fn();

    expect(
      resolveContextAction(
        input({
          front: tile({ chest: { opened: true, onActivate: vi.fn() } }),
          current: tile({ inspect: currentInspect }),
          surrounding: [tile({ npc: surroundingNpc })],
        }),
      ),
    ).toEqual({ kind: 'inspect', onActivate: currentInspect });
  });

  it('returns no action when there is no valid target', () => {
    expect(resolveContextAction(input())).toBeNull();
    expect(
      resolveContextAction(input({ front: tile({ chest: { opened: true, onActivate: vi.fn() } }) })),
    ).toBeNull();
  });

  it.each(['moving', 'turning', 'bumping', 'busy', 'inBattle', 'overlayOwnsInput'] as const)(
    'hides every action while %s',
    (lockedState) => {
      expect(
        resolveContextAction(
          input({
            state: { ...idle, [lockedState]: true },
            front: tile({ npc: vi.fn() }),
          }),
        ),
      ).toBeNull();
    },
  );
});

describe('FieldContextActions', () => {
  it('matches the field router priority and activates through its canonical callback', () => {
    const activate = vi.fn();
    const directSign = vi.fn();
    const actions = new FieldContextActions({
      playerTile: () => [5, 5] as const,
      facing: () => 'up' as const,
      indexOf: (x: number, y: number) => y * 10 + x,
      isCounter: (x: number, y: number) => x === 5 && y === 4,
      phase: () => 'idle' as const,
      busy: () => false,
      inBattle: () => false,
      inputLocked: () => false,
      overlayOwnsInput: () => false,
      npcs: () => new Map([[35, { id: 'counter-npc' }]]),
      chests: () => new Map<number, { opened: boolean }>(),
      signs: () => new Map([[45, directSign]]),
      midBoss: () => null,
      regionBosses: () => new Map<number, { tile: number }>(),
      areaBoss: () => null,
      lastBoss: () => null,
      chestOpened: (chest: { opened: boolean }) => chest.opened,
      activate,
    });

    expect(actions.view((key) => key, activate)).toMatchObject({
      kind: 'talk',
      label: 'field.contextTalk',
    });
    expect(actions.activate()).toBe(true);
    expect(activate).toHaveBeenCalledOnce();
    expect(directSign).not.toHaveBeenCalled();
  });

  it('resolved action and last rendered action are tracked separately', () => {
    const actions = new FieldContextActions({
      playerTile: () => [5, 5] as const,
      facing: () => 'up' as const,
      indexOf: (x: number, y: number) => y * 10 + x,
      isCounter: () => false,
      phase: () => 'idle' as const,
      busy: () => false,
      inBattle: () => false,
      inputLocked: () => false,
      overlayOwnsInput: () => false,
      npcs: () => new Map([[45, { id: 'guide' }]]),
      chests: () => new Map<number, { opened: boolean }>(),
      signs: () => new Map<number, () => void>(),
      midBoss: () => null,
      regionBosses: () => new Map<number, { tile: number }>(),
      areaBoss: () => null,
      lastBoss: () => null,
      chestOpened: (chest: { opened: boolean }) => chest.opened,
      activate: vi.fn(),
    });

    expect(actions.refresh()?.kind).toBe('talk');
    expect(actions.sync()).toBe(true);
    expect(actions.view((key) => key, vi.fn())?.kind).toBe('talk');
    expect(actions.sync()).toBe(false);
  });
});
