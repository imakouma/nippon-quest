import { describe, expect, it, vi } from 'vitest';
import { AutosaveCoordinator } from '../../src/core/state/autosave';
import { createNewGame } from '../../src/core/state/newGame';
import type { GameState } from '../../src/core/state/schema';
import type { SlotId } from '../../src/core/state/slots';

const state = (gold: number) => {
  const value = createNewGame({ name: 'ハル', starterMonsterId: 'aomori-ringoron', grade: 3 });
  value.player.gold = gold;
  return value;
};

describe('AutosaveCoordinator', () => {
  it('同じイベントループの保存要求を最新状態へまとめる', async () => {
    const calls: Array<[SlotId, GameState]> = [];
    const persist = vi.fn(async (slot: SlotId, value: GameState) => {
      calls.push([slot, value]);
    });
    const autosave = new AutosaveCoordinator(persist);
    await Promise.all([autosave.request(1, state(10)), autosave.request(1, state(20))]);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(calls[0]?.[1].player.gold).toBe(20);
  });

  it('書き込み中の要求を後続の最新状態へまとめる', async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const calls: Array<[SlotId, GameState]> = [];
    const persist = vi.fn(async (slot: SlotId, value: GameState) => {
      calls.push([slot, value]);
      if (persist.mock.calls.length === 1) await gate;
    });
    const autosave = new AutosaveCoordinator(persist);
    const first = autosave.request(2, state(10));
    await vi.waitFor(() => expect(persist).toHaveBeenCalledTimes(1));
    const later = Promise.all([autosave.request(2, state(20)), autosave.request(2, state(30))]);
    release();
    await Promise.all([first, later]);
    expect(persist).toHaveBeenCalledTimes(2);
    expect(calls[1]?.[1].player.gold).toBe(30);
  });

  it('失敗を呼び出し元へ返し、その後の保存は再試行できる', async () => {
    const persist = vi.fn().mockRejectedValueOnce(new Error('disk')).mockResolvedValue(undefined);
    const autosave = new AutosaveCoordinator(persist);
    await expect(autosave.request(3, state(10))).rejects.toThrow('disk');
    await expect(autosave.request(3, state(20))).resolves.toBeUndefined();
  });
});
