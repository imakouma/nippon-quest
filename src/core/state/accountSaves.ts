import { z } from 'zod/v3';
import { cloudSlotSchema, type CloudSlot, type CloudWrite } from './cloudProtocol';
import { gameStateSchema, type GameState } from './schema';
import { migrate } from './migrations';
import { SLOTS, type SlotId } from './slots';

export interface AccountDisk {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<T>;
  removeItem(key: string): Promise<void>;
}
export interface CloudTransport {
  list(): Promise<CloudSlot[]>;
  write(slot: SlotId, value: CloudWrite): Promise<CloudSlot>;
}
const envelopeSchema = z.object({
  revision: z.number().int().nonnegative(),
  mutation: z.string().uuid(),
  dirty: z.boolean(),
  state: z.unknown(),
  backup: z.unknown(),
  conflict: cloudSlotSchema.optional(),
});
type Envelope = Omit<z.infer<typeof envelopeSchema>, 'state' | 'backup'> & {
  state: GameState | null;
  backup: GameState | null;
};
export class AccountSaves {
  private queues = new Map<SlotId, Promise<unknown>>();
  private syncing: Promise<void> | null = null;
  private stopped = false;
  constructor(
    readonly owner: string,
    private disk: AccountDisk,
    private remote: CloudTransport,
    private changed = () => {},
  ) {}
  stop() {
    this.stopped = true;
  }
  async clear() {
    this.stop();
    await Promise.all(SLOTS.map((slot) => this.serial(slot, () => this.disk.removeItem(this.key(slot)))));
  }
  private key(slot: SlotId) {
    return `account:${encodeURIComponent(this.owner)}:slot:${slot}`;
  }
  private async serial<T>(slot: SlotId, fn: () => Promise<T>): Promise<T> {
    const result = (this.queues.get(slot) ?? Promise.resolve()).catch(() => {}).then(fn);
    this.queues.set(slot, result);
    try {
      return await result;
    } finally {
      if (this.queues.get(slot) === result) this.queues.delete(slot);
    }
  }
  private async read(slot: SlotId): Promise<Envelope> {
    const raw = await this.disk.getItem<unknown>(this.key(slot));
    if (raw === null)
      return { revision: 0, mutation: crypto.randomUUID(), dirty: false, state: null, backup: null };
    const value = envelopeSchema.parse(raw);
    let backup: GameState | null = null;
    try {
      backup = value.backup ? migrate(value.backup).state : null;
    } catch {
      /* A good primary still works. */
    }
    let state: GameState | null;
    try {
      state = value.state ? migrate(value.state).state : null;
    } catch {
      if (!backup) throw new Error('Corrupt account save');
      state = backup;
    }
    return { ...value, state, backup };
  }
  private async put(slot: SlotId, value: Envelope) {
    await this.disk.setItem(this.key(slot), value);
    if (!this.stopped) this.changed();
  }
  async save(slot: SlotId, state: GameState | null) {
    if (this.stopped) throw new Error('Account changed');
    const snapshot = state === null ? null : gameStateSchema.parse(state);
    await this.serial(slot, async () => {
      const previous = await this.read(slot);
      await this.put(slot, {
        ...previous,
        state: snapshot,
        backup: previous.state ?? previous.backup,
        dirty: true,
        mutation: crypto.randomUUID(),
      });
    });
  }
  async load(slot: SlotId) {
    return this.serial(slot, async () => (await this.read(slot)).state);
  }
  async details() {
    return Promise.all(
      SLOTS.map((slot) =>
        this.serial(slot, async () => {
          const value = await this.read(slot);
          return {
            slot,
            state: value.state,
            remote: value.conflict?.state,
            status: value.conflict
              ? ('conflict' as const)
              : value.dirty
                ? ('pending' as const)
                : ('synced' as const),
          };
        }),
      ),
    );
  }
  async resolve(slot: SlotId, choice: 'local' | 'cloud') {
    if (this.stopped) throw new Error('Account changed');
    await this.serial(slot, async () => {
      const value = await this.read(slot);
      if (!value.conflict) return;
      const remote = value.conflict;
      await this.put(slot, {
        ...value,
        conflict: undefined,
        revision: remote.revision,
        state: choice === 'cloud' ? remote.state : value.state,
        backup: value.state ?? value.backup,
        mutation: choice === 'cloud' ? remote.mutation : crypto.randomUUID(),
        dirty: choice === 'local',
      });
    });
    await this.sync();
  }
  async sync(pull = false): Promise<void> {
    if (this.stopped) return;
    if (this.syncing) return this.syncing;
    this.syncing = this.performSync(pull).finally(() => {
      this.syncing = null;
      if (!this.stopped) this.changed();
    });
    return this.syncing;
  }
  private async performSync(pull: boolean) {
    try {
      const rows = await this.remote.list();
      if (this.stopped) return;
      for (const slot of SLOTS) {
        if (this.stopped) return;
        const remote = rows.find((row) => row.slot === slot);
        const snapshot = await this.serial(slot, async () => {
          const value = await this.read(slot);
          if (!value.dirty) {
            if (!pull && remote && remote.revision !== value.revision) {
              if (value.state)
                await this.put(slot, {
                  ...value,
                  conflict: remote,
                  dirty: true,
                  mutation: crypto.randomUUID(),
                });
              return null;
            }
            if (remote && remote.revision !== value.revision)
              await this.put(slot, {
                revision: remote.revision,
                mutation: remote.mutation,
                state: remote.state,
                backup: value.state ?? value.backup,
                dirty: false,
              });
            return null;
          }
          if (remote?.mutation === value.mutation) {
            await this.put(slot, { ...value, revision: remote.revision, dirty: false, conflict: undefined });
            return null;
          }
          if ((remote?.revision ?? 0) !== value.revision) {
            if (remote) await this.put(slot, { ...value, conflict: remote });
            return null;
          }
          if (value.conflict) return null;
          return value;
        });
        if (!snapshot || this.stopped) continue;
        try {
          const written = await this.remote.write(slot, {
            revision: snapshot.revision,
            mutation: snapshot.mutation,
            state: snapshot.state,
          });
          if (this.stopped) return;
          await this.serial(slot, async () => {
            const current = await this.read(slot);
            // A local save during the request stays dirty, based on the newly acknowledged revision.
            await this.put(slot, {
              ...current,
              revision: written.revision,
              dirty: current.mutation !== snapshot.mutation,
            });
          });
        } catch {
          // The durable dirty snapshot is retained. Next sync fetches the conflict or retries its mutation ID.
        }
      }
    } catch {
      /* Offline or expired session: retain all local data and pending writes. */
    }
  }
}
