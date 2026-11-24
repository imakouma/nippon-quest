import { describe, expect, it } from 'vitest';
import { AccountSaves } from '../../src/core/state/accountSaves';
import { createNewGame } from '../../src/core/state/newGame';
import type { CloudSlot, CloudWrite } from '../../src/core/state/cloudProtocol';
const fresh = (gold: number) => {
  const state = createNewGame({ name: 'ハル', grade: 3 });
  state.player.gold = gold;
  return state;
};
function setup() {
  const disk = new Map<string, unknown>();
  let remote: CloudSlot | null = null;
  let offline = false;
  const storage = {
    removeItem: async (key: string) => {
      disk.delete(key);
    },
    getItem: async <T>(key: string) => structuredClone(disk.get(key) ?? null) as T | null,
    setItem: async <T>(key: string, value: T) => {
      disk.set(key, structuredClone(value));
      return value;
    },
  };
  const transport = {
    list: async () => {
      if (offline) throw new Error('offline');
      return remote ? [structuredClone(remote)] : [];
    },
    write: async (slot: 1 | 2 | 3, value: CloudWrite) => {
      if (offline) throw new Error('offline');
      if ((remote?.revision ?? 0) !== value.revision) throw new Error('conflict');
      remote = { ...value, slot, revision: value.revision + 1 };
      return structuredClone(remote);
    },
  };
  return {
    storage,
    transport,
    disk,
    offline: (value: boolean) => {
      offline = value;
    },
    remote: () => remote,
    setRemote: (value: CloudSlot) => {
      remote = value;
    },
  };
}
describe('account saves', () => {
  it('isolates guest and other account data', async () => {
    const s = setup();
    const a = new AccountSaves('alice', s.storage, s.transport);
    const b = new AccountSaves('bob', s.storage, s.transport);
    await a.save(1, fresh(10));
    expect((await a.load(1))?.player.gold).toBe(10);
    expect(await b.load(1)).toBeNull();
    expect(s.disk.has('save:1')).toBe(false);
  });
  it('persists offline writes and uploads after reconnect', async () => {
    const s = setup();
    const a = new AccountSaves('alice', s.storage, s.transport);
    s.offline(true);
    await a.save(1, fresh(20));
    await a.sync();
    expect((await a.load(1))?.player.gold).toBe(20);
    expect((await a.details())[0]?.status).toBe('pending');
    s.offline(false);
    await a.sync();
    expect(s.remote()?.state?.player.gold).toBe(20);
    expect((await a.details())[0]?.status).toBe('synced');
  });
  it('keeps both versions on a remote conflict until explicitly resolved', async () => {
    const s = setup();
    const a = new AccountSaves('alice', s.storage, s.transport);
    await a.save(1, fresh(30));
    s.setRemote({ slot: 1, revision: 4, mutation: crypto.randomUUID(), state: fresh(40) });
    await a.sync();
    expect((await a.details())[0]?.status).toBe('conflict');
    expect((await a.load(1))?.player.gold).toBe(30);
    await a.resolve(1, 'cloud');
    expect((await a.load(1))?.player.gold).toBe(40);
  });
  it('retains a tombstone and conflicts with a stale offline edit', async () => {
    const s = setup();
    const a = new AccountSaves('alice', s.storage, s.transport);
    await a.save(1, fresh(10));
    await a.sync();
    await a.save(1, fresh(20));
    s.setRemote({ slot: 1, revision: 2, mutation: crypto.randomUUID(), state: null });
    await a.sync();
    expect((await a.details())[0]?.status).toBe('conflict');
    expect(s.remote()?.state).toBeNull();
  });
  it('does not replace a running game with a newer clean cloud snapshot', async () => {
    const s = setup();
    const a = new AccountSaves('alice', s.storage, s.transport);
    await a.save(1, fresh(10));
    await a.sync();
    s.setRemote({ slot: 1, revision: 2, mutation: crypto.randomUUID(), state: fresh(20) });
    await a.sync();
    expect((await a.load(1))?.player.gold).toBe(10);
    expect((await a.details())[0]?.status).toBe('conflict');
  });
  it('keeps a newer local write dirty when an older upload finishes', async () => {
    const s = setup();
    const a = new AccountSaves('alice', s.storage, s.transport);
    let release!: () => void;
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const write = s.transport.write;
    s.transport.write = async (slot, value) => {
      entered();
      await gate;
      return write(slot, value);
    };
    await a.save(1, fresh(10));
    const syncing = a.sync();
    await started;
    await a.save(1, fresh(20));
    release();
    await syncing;
    expect((await a.load(1))?.player.gold).toBe(20);
    expect((await a.details())[0]?.status).toBe('pending');
    await a.sync();
    expect(s.remote()?.state?.player.gold).toBe(20);
  });
  it('retains an unacknowledged upload and recognizes its mutation on retry', async () => {
    const s = setup();
    const a = new AccountSaves('alice', s.storage, s.transport);
    const write = s.transport.write;
    s.transport.write = async (slot, value) => {
      await write(slot, value);
      throw new Error('response lost');
    };
    await a.save(1, fresh(10));
    await a.sync();
    expect((await a.details())[0]?.status).toBe('pending');
    await a.sync();
    expect((await a.details())[0]?.status).toBe('synced');
    expect(s.remote()?.revision).toBe(1);
  });
  it('clears only the deleted account and blocks subsequent saves', async () => {
    const s = setup();
    const a = new AccountSaves('alice', s.storage, s.transport);
    const b = new AccountSaves('bob', s.storage, s.transport);
    await a.save(1, fresh(10));
    await b.save(1, fresh(20));
    await a.clear();
    expect((await b.load(1))?.player.gold).toBe(20);
    expect(await a.load(1)).toBeNull();
    await expect(a.save(1, fresh(30))).rejects.toThrow('Account changed');
  });
});
