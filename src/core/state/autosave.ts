import type { GameState } from './schema';
import type { SlotId } from './slots';

export type PersistGame = (slot: SlotId, state: GameState) => Promise<void>;

/**
 * 同じイベントループ内の保存要求は最新状態へまとめ、書き込み中に来た要求も
 * 1 件の後続保存へまとめる。IndexedDB のバックアップを無意味に回転させない。
 */
export class AutosaveCoordinator {
  private pending = new Map<SlotId, GameState>();
  private waiters = new Map<SlotId, Array<{ resolve: () => void; reject: (error: unknown) => void }>>();
  private scheduled = new Set<SlotId>();
  private running = new Set<SlotId>();

  constructor(private readonly persist: PersistGame) {}

  request(slot: SlotId, state: GameState): Promise<void> {
    this.pending.set(slot, structuredClone(state));
    const result = new Promise<void>((resolve, reject) => {
      const list = this.waiters.get(slot) ?? [];
      list.push({ resolve, reject });
      this.waiters.set(slot, list);
    });
    this.schedule(slot);
    return result;
  }

  private schedule(slot: SlotId): void {
    if (this.scheduled.has(slot) || this.running.has(slot)) return;
    this.scheduled.add(slot);
    queueMicrotask(() => {
      this.scheduled.delete(slot);
      void this.flush(slot);
    });
  }

  private async flush(slot: SlotId): Promise<void> {
    if (this.running.has(slot)) return;
    const state = this.pending.get(slot);
    if (!state) return;
    this.pending.delete(slot);
    const waiters = this.waiters.get(slot) ?? [];
    this.waiters.delete(slot);
    this.running.add(slot);
    try {
      await this.persist(slot, state);
      for (const waiter of waiters) waiter.resolve();
    } catch (error) {
      for (const waiter of waiters) waiter.reject(error);
    } finally {
      this.running.delete(slot);
      if (this.pending.has(slot)) this.schedule(slot);
    }
  }
}
