/**
 * セーブ／ロード。端末内のみ（IndexedDB via localforage）。ログイン不要・個人情報なし。
 * 保護者メニューから JSON エクスポート／インポートできる。
 */
import localforage from 'localforage';
import type { NewGameOptions } from './newGame';
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
const STALE_CHUNK_RELOAD_KEY = 'nq:stale-chunk-reload';

export type StartupRetryAction =
  { type: 'start'; options: NewGameOptions; slot: SlotId } | { type: 'continue'; slot: SlotId };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBoundedInteger(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
}

function isNewGameOptions(value: unknown): value is NewGameOptions {
  if (!isRecord(value)) return false;
  if (typeof value.name !== 'string' || value.name.length < 1 || value.name.length > 6) return false;
  if (![1, 2, 3, 4, 5, 6].includes(value.grade as number)) return false;
  if (value.appearance === undefined) return true;
  if (!isRecord(value.appearance)) return false;
  return (
    isBoundedInteger(value.appearance.hair, 7) &&
    isBoundedInteger(value.appearance.skin, 6) &&
    isBoundedInteger(value.appearance.cloth, 9) &&
    (value.appearance.hairStyle === undefined || isBoundedInteger(value.appearance.hairStyle, 3)) &&
    (value.appearance.eyes === undefined || isBoundedInteger(value.appearance.eyes, 2))
  );
}

function isStartupRetryAction(value: unknown): value is StartupRetryAction {
  if (!isRecord(value) || !SLOTS.includes(value.slot as SlotId)) return false;
  if (value.type === 'continue') return true;
  return value.type === 'start' && isNewGameOptions(value.options);
}

/** ページ再読込をまたぐ起動再試行だけに使う、一回限りの一時データ。 */
export function storeStartupRetryAction(action: StartupRetryAction): void {
  try {
    sessionStorage.setItem(STARTUP_RETRY_KEY, JSON.stringify(action));
  } catch {
    // プライベートモード等で一時保存を拒否されても、通常の起動は続ける。
  }
}

export function takeStartupRetryAction(): StartupRetryAction | undefined {
  try {
    const serialized = sessionStorage.getItem(STARTUP_RETRY_KEY);
    if (!serialized) return undefined;
    sessionStorage.removeItem(STARTUP_RETRY_KEY);
    const action = JSON.parse(serialized) as unknown;
    return isStartupRetryAction(action) ? action : undefined;
  } catch {
    return undefined;
  }
}

/** 古いチャンクを検出したときの再読込を、同じタブで一度だけ許可する。 */
export function takeStaleChunkReloadChance(): boolean {
  try {
    if (sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY)) return false;
    sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, '1');
    return true;
  } catch {
    // 記録できない環境では、再読込ループを避ける方を優先する。
    return false;
  }
}

export function clearStaleChunkReloadChance(): void {
  try {
    sessionStorage.removeItem(STALE_CHUNK_RELOAD_KEY);
  } catch {
    // sessionStorage を利用できない環境では解除も不要。
  }
}

async function enqueueSlot<T>(slot: SlotId, operation: () => Promise<T>): Promise<T> {
  const previous = saveQueues.get(slot) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);
  const queued = result.then(
    () => undefined,
    () => undefined,
  );
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

async function readSlot(slot: SlotId): Promise<{ raw: unknown; backup: unknown; error?: unknown }> {
  const [current, previous] = await Promise.allSettled([
    store.getItem(key(slot)),
    store.getItem(backupKey(slot)),
  ]);
  return {
    raw: current.status === 'fulfilled' ? current.value : null,
    backup: previous.status === 'fulfilled' ? previous.value : null,
    error:
      current.status === 'rejected'
        ? current.reason
        : previous.status === 'rejected'
          ? previous.reason
          : undefined,
  };
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
    const { raw, backup, error } = await readSlot(slot);
    if (!raw && !backup) {
      if (error) throw error;
      return null;
    }
    const recovered = recoverState(raw, backup);
    if (!recovered) {
      if (error) throw error;
      throw new Error('セーブデータとバックアップの両方が壊れています');
    }
    if (recovered.recovered) await store.setItem(key(slot), recovered.state).catch(() => undefined);
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
        const { raw, backup, error } = await readSlot(slot);
        const summary = summarizeSlot(slot, raw, backup);
        if (!summary.exists && error) throw error;
        return summary;
      }),
    ),
  );
}
