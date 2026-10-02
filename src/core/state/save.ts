/**
 * セーブ／ロード。端末内のみ（IndexedDB via localforage）。ログイン不要・個人情報なし。
 * 保護者メニューから JSON エクスポート／インポートできる。
 */
import localforage from 'localforage';
import { SCHEMA_VERSION, gameStateSchema, type GameState } from './schema';
import { migrate } from './migrations';

const store = localforage.createInstance({ name: 'nihonquest', storeName: 'saves' });
export const SLOTS = [1, 2, 3] as const;
export type SlotId = (typeof SLOTS)[number];

const key = (slot: SlotId) => `save:${slot}`;
const backupKey = (slot: SlotId) => `backup:${slot}`;
const saveQueues = new Map<SlotId, Promise<void>>();

export interface SlotSummary {
  slot: SlotId;
  exists: boolean;
  corrupted?: boolean;
  recovered?: boolean;
  name?: string;
  level?: number;
  area?: string;
  updatedAt?: number;
  signs?: number;
}

function parsedState(raw: unknown): GameState | null {
  try {
    return raw ? migrate(raw).state : null;
  } catch {
    return null;
  }
}

export function recoverState(
  primary: unknown,
  backup: unknown,
): { state: GameState; recovered: boolean } | null {
  const current = parsedState(primary);
  if (current) return { state: current, recovered: false };
  const fallback = parsedState(backup);
  return fallback ? { state: fallback, recovered: true } : null;
}

export function summarizeSlot(slot: SlotId, raw: unknown, backup?: unknown): SlotSummary {
  if (!raw && !backup) return { slot, exists: false };
  const recovered = recoverState(raw, backup);
  if (recovered) {
    const { state } = recovered;
    return {
      slot,
      exists: true,
      ...(recovered.recovered ? { recovered: true } : {}),
      name: state.player.name,
      level: state.player.level,
      area: state.progress.currentArea,
      updatedAt: state.updatedAt,
      signs: state.progress.areaSigns.length,
    };
  }
  return { slot, exists: false, corrupted: true };
}

export async function save(slot: SlotId, state: GameState): Promise<void> {
  // 呼び出し元が保存待ちの間に同じオブジェクトを変更しても、保存要求時点の内容を固定する。
  const snapshot = gameStateSchema.parse({
    ...state,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: Date.now(),
  });
  const previous = saveQueues.get(slot) ?? Promise.resolve();
  const queued = previous
    .catch(() => undefined)
    .then(async () => {
      const current = await store.getItem(key(slot));
      if (parsedState(current)) await store.setItem(backupKey(slot), current);
      await store.setItem(key(slot), snapshot);
    });
  saveQueues.set(slot, queued);
  try {
    await queued;
  } finally {
    if (saveQueues.get(slot) === queued) saveQueues.delete(slot);
  }
}

export async function load(slot: SlotId): Promise<GameState | null> {
  await saveQueues.get(slot)?.catch(() => undefined);
  const [raw, backup] = await Promise.all([store.getItem(key(slot)), store.getItem(backupKey(slot))]);
  if (!raw && !backup) return null;
  const recovered = recoverState(raw, backup);
  if (!recovered) throw new Error('セーブデータとバックアップの両方が壊れています');
  if (recovered.recovered) await store.setItem(key(slot), recovered.state);
  return recovered.state;
}

export async function remove(slot: SlotId): Promise<void> {
  await saveQueues.get(slot)?.catch(() => undefined);
  await Promise.all([store.removeItem(key(slot)), store.removeItem(backupKey(slot))]);
}

export async function summaries(): Promise<SlotSummary[]> {
  return Promise.all(
    SLOTS.map(async (slot) => {
      await saveQueues.get(slot)?.catch(() => undefined);
      const [raw, backup] = await Promise.all([store.getItem(key(slot)), store.getItem(backupKey(slot))]);
      return summarizeSlot(slot, raw, backup);
    }),
  );
}

export function exportJson(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importJson(text: string): GameState {
  return migrate(JSON.parse(text)).state;
}
