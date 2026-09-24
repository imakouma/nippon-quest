import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { migrate } from '../../src/core/state/migrations';
import { SCHEMA_VERSION, gameStateSchema } from '../../src/core/state/schema';
import { exportJson, importJson } from '../../src/core/state/save';

const fresh = () => createNewGame({ name: 'ハル', starterMonsterId: 'aomori-ringoron', grade: 3 });

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
  it('新しすぎるセーブは拒否する', () => {
    expect(() => migrate({ ...fresh(), schemaVersion: SCHEMA_VERSION + 5 })).toThrow(/新しすぎる/);
  });
  it('壊れたセーブは分かるメッセージで落ちる', () => {
    const s = fresh() as Record<string, unknown>;
    delete s.progress;
    expect(() => migrate(s)).toThrow(/壊れています/);
  });
});
