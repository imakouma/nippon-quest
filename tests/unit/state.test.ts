import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { migrate } from '../../src/core/state/migrations';
import { SCHEMA_VERSION, gameStateSchema } from '../../src/core/state/schema';
import { exportJson, importJson, summarizeSlot } from '../../src/core/state/save';

const fresh = () => createNewGame({ name: 'ハル', grade: 3 });

describe('GameState', () => {
  it('新規ゲームがスキーマを満たす', () => {
    expect(gameStateSchema.safeParse(fresh()).success).toBe(true);
  });
  it('個人情報を持たない（名前は6文字までのニックネームのみ）', () => {
    const s = fresh();
    expect(Object.keys(s.player)).not.toContain('email');
    expect(
      gameStateSchema.safeParse({ ...s, player: { ...s.player, name: 'ながすぎるなまえ' } }).success,
    ).toBe(false);
  });
  it('エクスポート → インポートで往復できる', () => {
    const s = fresh();
    expect(importJson(exportJson(s))).toEqual(s);
  });
  it('現行バージョンはそのまま通る', () => {
    const r = migrate(fresh());
    expect(r.migratedFrom).toBeNull();
    expect(r.state.schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('v2 の学習データへ履歴と概念状態を追加して移行する', () => {
    const current = fresh();
    const legacy = structuredClone(current) as unknown as {
      schemaVersion: number;
      learning: {
        attempts?: unknown;
        conceptStates?: unknown;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    legacy.schemaVersion = 2;
    delete legacy.learning.attempts;
    delete legacy.learning.conceptStates;
    const migrated = migrate(legacy);
    expect(migrated.migratedFrom).toBe(2);
    expect(migrated.state.learning.attempts).toEqual([]);
    expect(migrated.state.learning.conceptStates).toEqual({});
  });
  it('新しすぎるセーブは拒否する', () => {
    expect(() => migrate({ ...fresh(), schemaVersion: SCHEMA_VERSION + 5 })).toThrow(/新しすぎる/);
  });
  it('壊れたセーブは分かるメッセージで落ちる', () => {
    const s = fresh() as Record<string, unknown>;
    delete s.progress;
    expect(() => migrate(s)).toThrow(/壊れています/);
  });
  it('スロット一覧では壊れたセーブを続行可能にしない', () => {
    const broken = { ...fresh(), progress: undefined };
    expect(summarizeSlot(2, broken)).toEqual({ slot: 2, exists: false, corrupted: true });
  });
  it('旧バージョンのスロット概要も移行後の値から作る', () => {
    const legacy = structuredClone(fresh()) as ReturnType<typeof fresh> & { schemaVersion: number };
    legacy.schemaVersion = 2;
    delete (legacy.learning as Partial<typeof legacy.learning>).attempts;
    delete (legacy.learning as Partial<typeof legacy.learning>).conceptStates;
    expect(summarizeSlot(1, legacy)).toMatchObject({ slot: 1, exists: true, name: 'ハル' });
  });
});
