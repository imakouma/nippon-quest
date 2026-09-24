/**
 * セーブ／ロード。端末内のみ（IndexedDB via localforage）。ログイン不要・個人情報なし。
 * 保護者メニューから JSON エクスポート／インポートできる。
 */
import localforage from 'localforage';
import { SCHEMA_VERSION, type GameState } from './schema';
import { migrate } from './migrations';

const store = localforage.createInstance({ name: 'nihonquest', storeName: 'saves' });
export const SLOTS = [1, 2, 3] as const;
export type SlotId = (typeof SLOTS)[number];

const key = (slot: SlotId) => `save:${slot}`;

export interface SlotSummary {
  slot: SlotId;
  exists: boolean;
  name?: string;
  level?: number;
  area?: string;
  updatedAt?: number;
  signs?: number;
}

export async function save(slot: SlotId, state: GameState): Promise<void> {
  await store.setItem(key(slot), { ...state, schemaVersion: SCHEMA_VERSION, updatedAt: Date.now() });
}

export async function load(slot: SlotId): Promise<GameState | null> {
  const raw = await store.getItem(key(slot));
  if (!raw) return null;
  return migrate(raw).state;
}

export async function remove(slot: SlotId): Promise<void> {
  await store.removeItem(key(slot));
}

export async function summaries(): Promise<SlotSummary[]> {
  return Promise.all(
    SLOTS.map(async (slot) => {
      const raw = (await store.getItem(key(slot))) as GameState | null;
      if (!raw) return { slot, exists: false };
      return {
        slot,
        exists: true,
        name: raw.player?.name,
        level: raw.player?.level,
        area: raw.progress?.currentArea,
        updatedAt: raw.updatedAt,
        signs: raw.progress?.areaSigns?.length,
      };
    }),
  );
}

export function exportJson(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importJson(text: string): GameState {
  return migrate(JSON.parse(text)).state;
}
