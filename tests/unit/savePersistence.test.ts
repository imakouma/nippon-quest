import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, unknown>());
const controls = vi.hoisted(() => ({
  getGate: null as Promise<void> | null,
  gatedGets: 0,
  removeGate: null as Promise<void> | null,
  removeCalls: 0,
}));

vi.mock('localforage', () => ({
  default: {
    createInstance: () => ({
      getItem: async (key: string) => {
        const value = storage.get(key) ?? null;
        if (controls.getGate && controls.gatedGets < 2) {
          controls.gatedGets += 1;
          await controls.getGate;
        }
        return structuredClone(value);
      },
      setItem: async (key: string, value: unknown) => {
        storage.set(key, structuredClone(value));
        return value;
      },
      removeItem: async (key: string) => {
        controls.removeCalls += 1;
        await controls.removeGate;
        storage.delete(key);
      },
    }),
  },
}));

import { createNewGame } from '../../src/core/state/newGame';
import { load, remove, save, summaries } from '../../src/core/state/save';
import type { GameState } from '../../src/core/state/schema';

const fresh = (gold: number) => {
  const state = createNewGame({ name: 'ハル', grade: 3 });
  state.player.gold = gold;
  return state;
};

beforeEach(() => {
  storage.clear();
  controls.getGate = null;
  controls.gatedGets = 0;
  controls.removeGate = null;
  controls.removeCalls = 0;
});

describe('セーブ永続化', () => {
  it('並行保存を呼び出し順に直列化し、直前の正常状態をバックアップする', async () => {
    await save(1, fresh(10));
    await Promise.all([save(1, fresh(20)), save(1, fresh(30))]);

    expect((storage.get('save:1') as GameState).player.gold).toBe(30);
    expect((storage.get('backup:1') as GameState).player.gold).toBe(20);
  });

  it('保存待ちの間に呼び出し元が状態を変更しても、要求時点の内容を保存する', async () => {
    const state = fresh(40);
    const pending = save(1, state);
    state.player.gold = 999;
    await pending;
    expect((storage.get('save:1') as GameState).player.gold).toBe(40);
  });

  it('主データ破損時はバックアップを読み込み、主データも自己修復する', async () => {
    await save(2, fresh(10));
    await save(2, fresh(20));
    storage.set('save:2', { broken: true });

    const recovered = await load(2);
    expect(recovered?.player.gold).toBe(10);
    expect((storage.get('save:2') as GameState).player.gold).toBe(10);
    expect((await summaries()).find((slot) => slot.slot === 2)).toMatchObject({
      exists: true,
      name: 'ハル',
    });
  });

  it('バックアップ復旧中の新しい保存を、古い状態で上書きしない', async () => {
    await save(2, fresh(10));
    await save(2, fresh(20));
    storage.set('save:2', { broken: true });
    let release = () => {};
    controls.getGate = new Promise<void>((resolve) => {
      release = () => resolve();
    });

    const loading = load(2);
    await vi.waitFor(() => expect(controls.gatedGets).toBe(2));
    const saving = save(2, fresh(30));
    release();
    await Promise.all([loading, saving]);

    expect((storage.get('save:2') as GameState).player.gold).toBe(30);
  });

  it('不正な状態は保存せず、正常な主データとバックアップを残す', async () => {
    await save(3, fresh(10));
    const invalid = { ...fresh(99), progress: undefined } as unknown as GameState;
    await expect(save(3, invalid)).rejects.toThrow();
    expect((storage.get('save:3') as GameState).player.gold).toBe(10);
    expect(storage.has('backup:3')).toBe(false);
  });

  it('スロット削除時は主データとバックアップを両方消す', async () => {
    await save(1, fresh(10));
    await save(1, fresh(20));
    await remove(1);
    expect(storage.has('save:1')).toBe(false);
    expect(storage.has('backup:1')).toBe(false);
  });

  it('削除中に新しい保存が要求された場合は、新しい状態を削除後に保存する', async () => {
    await save(1, fresh(10));
    let release = () => {};
    controls.removeGate = new Promise<void>((resolve) => {
      release = () => resolve();
    });

    const removing = remove(1);
    await vi.waitFor(() => expect(controls.removeCalls).toBe(2));
    const saving = save(1, fresh(30));
    release();
    await Promise.all([removing, saving]);

    expect((storage.get('save:1') as GameState).player.gold).toBe(30);
  });
});
