import { describe, expect, it } from 'vitest';
import {
  resolveFieldInteraction,
  type FieldInteractionCandidate,
  type FieldInteractionInput,
} from '../../src/scenes/overworld/fieldInteractionRouter';

const position = (x: number, y: number) => ({ x, y });

function input(
  candidates: readonly FieldInteractionCandidate[],
  patch: Partial<FieldInteractionInput> = {},
): FieldInteractionInput {
  return {
    intent: 'interact',
    player: { position: position(4, 5), facing: 'up' },
    frontTile: { position: position(4, 4), isCounter: false },
    flow: { locked: false, frame: 12, lastHandledFrame: 11 },
    candidates,
    ...patch,
  };
}

describe('resolveFieldInteraction', () => {
  it('正面のbattleをNPC・看板・足元背景より優先して一件だけ返す', () => {
    const candidates: FieldInteractionCandidate[] = [
      { id: 'ground', kind: 'background', activation: 'underfoot', position: position(4, 5) },
      { id: 'sign', kind: 'sign', activation: 'front', position: position(4, 4) },
      { id: 'npc', kind: 'npc', activation: 'front', position: position(4, 4) },
      {
        id: 'boss',
        kind: 'battle',
        battleType: 'mid-boss',
        activation: 'front',
        position: position(4, 4),
      },
    ];

    expect(resolveFieldInteraction(input(candidates))).toEqual({
      kind: 'action',
      candidate: candidates[3],
    });
  });

  it('同一frameで処理済みなら二重発火しない', () => {
    expect(
      resolveFieldInteraction(
        input([{ id: 'npc', kind: 'npc', activation: 'front', position: position(4, 4) }], {
          flow: { locked: false, frame: 12, lastHandledFrame: 12 },
        }),
      ),
    ).toEqual({ kind: 'none', reason: 'already-handled-frame' });
  });

  it('counter越しの正面NPCを選ぶ', () => {
    const npc: FieldInteractionCandidate = {
      id: 'shopkeeper',
      kind: 'npc',
      activation: 'counter',
      position: position(4, 3),
    };

    expect(
      resolveFieldInteraction(input([npc], { frontTile: { position: position(4, 4), isCounter: true } })),
    ).toEqual({ kind: 'action', candidate: npc });
  });

  it('requiredFacingが一致する候補だけを選ぶ', () => {
    const wrong: FieldInteractionCandidate = {
      id: 'wrong',
      kind: 'sign',
      activation: 'front',
      position: position(4, 4),
      requiredFacing: 'down',
    };
    const right: FieldInteractionCandidate = {
      id: 'right',
      kind: 'sign',
      activation: 'front',
      position: position(4, 4),
      requiredFacing: 'up',
    };

    expect(resolveFieldInteraction(input([wrong, right]))).toEqual({ kind: 'action', candidate: right });
  });

  it('対象がなければnoneを返す', () => {
    expect(resolveFieldInteraction(input([]))).toEqual({ kind: 'none', reason: 'no-target' });
  });

  it('入力lock中は候補を実行対象にしない', () => {
    expect(
      resolveFieldInteraction(
        input([{ id: 'npc', kind: 'npc', activation: 'front', position: position(4, 4) }], {
          flow: { locked: true, frame: 12, lastHandledFrame: 11 },
        }),
      ),
    ).toEqual({ kind: 'none', reason: 'flow-locked' });
  });

  it('到着時はlocked transition・transition・warp・event・battleの順に選ぶ', () => {
    const candidates: FieldInteractionCandidate[] = [
      {
        id: 'battle',
        kind: 'battle',
        battleType: 'random',
        activation: 'underfoot',
        position: position(4, 5),
      },
      { id: 'event', kind: 'field-event', activation: 'underfoot', position: position(4, 5) },
      { id: 'warp', kind: 'warp', activation: 'underfoot', position: position(4, 5) },
      {
        id: 'door',
        kind: 'map-transition',
        activation: 'underfoot',
        position: position(4, 5),
        request: { targetMap: 'aomori-town', reason: 'door' },
      },
      { id: 'locked', kind: 'locked-transition', activation: 'underfoot', position: position(4, 5) },
    ];

    expect(resolveFieldInteraction(input(candidates, { intent: 'arrive' }))).toEqual({
      kind: 'action',
      candidate: candidates[4],
    });
  });

  it('menu intentではmenu候補だけを選ぶ', () => {
    const menu: FieldInteractionCandidate = { id: 'menu', kind: 'menu', activation: 'menu' };
    expect(
      resolveFieldInteraction(
        input([{ id: 'npc', kind: 'npc', activation: 'front', position: position(4, 4) }, menu], {
          intent: 'menu',
        }),
      ),
    ).toEqual({ kind: 'action', candidate: menu });
  });
});
