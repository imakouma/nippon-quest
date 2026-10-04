/**
 * セーブ／ロード。端末内のみ（IndexedDB via localforage）。ログイン不要・個人情報なし。
 * 保護者メニューから JSON エクスポート／インポートできる。
 */
import localforage from 'localforage';
import { SCHEMA_VERSION, gameStateSchema, type GameState } from './schema';
import { migrate } from './migrations';
import { SLOTS, type SlotId, type SlotSummary } from './slots';
export { exportGameJson as exportJson, importGameJson as importJson } from './serialization';
export { SLOTS, type SlotId, type SlotSummary } from './slots';

const store = localforage.createInstance({ name: 'nihonquest', storeName: 'saves' });
const key = (slot: SlotId) => `save:${slot}`;
const backupKey = (slot: SlotId) => `backup:${slot}`;
const saveQueues = new Map<SlotId, Promise<void>>();
const STARTUP_RETRY_KEY = 'nq:retry-title-action';

/** ページ再読込をまたぐ起動再試行だけに使う、一回限りの一時データ。 */
export function storeStartupRetryAction(action: unknown): void {
  sessionStorage.setItem(STARTUP_RETRY_KEY, JSON.stringify(action));
}

export function takeStartupRetryAction(): unknown {
  const serialized = sessionStorage.getItem(STARTUP_RETRY_KEY);
  if (!serialized) return undefined;
  sessionStorage.removeItem(STARTUP_RETRY_KEY);
  return JSON.parse(serialized) as unknown;
}

async function enqueueSlot<T>(slot: SlotId, operation: () => Promise<T>): Promise<T> {
  const previous = saveQueues.get(slot) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);
  const queued = result.then(() => undefined);
  saveQueues.set(slot, queued);
  try {
    return await result;
  } finally {
    if (saveQueues.get(slot) === queued) saveQueues.delete(slot);
  }
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
  await enqueueSlot(slot, async () => {
    const current = await store.getItem(key(slot));
    if (parsedState(current)) await store.setItem(backupKey(slot), current);
    await store.setItem(key(slot), snapshot);
  });
}

export async function load(slot: SlotId): Promise<GameState | null> {
  return enqueueSlot(slot, async () => {
    const [raw, backup] = await Promise.all([store.getItem(key(slot)), store.getItem(backupKey(slot))]);
    if (!raw && !backup) return null;
    const recovered = recoverState(raw, backup);
    if (!recovered) throw new Error('セーブデータとバックアップの両方が壊れています');
    if (recovered.recovered) await store.setItem(key(slot), recovered.state);
    return recovered.state;
  });
}

export async function remove(slot: SlotId): Promise<void> {
  await enqueueSlot(slot, async () => {
    await Promise.all([store.removeItem(key(slot)), store.removeItem(backupKey(slot))]);
  });
}

export async function summaries(): Promise<SlotSummary[]> {
  return Promise.all(
    SLOTS.map((slot) =>
      enqueueSlot(slot, async () => {
        const [raw, backup] = await Promise.all([store.getItem(key(slot)), store.getItem(backupKey(slot))]);
        return summarizeSlot(slot, raw, backup);
      }),
    ),
  );
}
