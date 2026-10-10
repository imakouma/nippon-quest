import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { migrate } from '../../src/core/state/migrations';
import { SCHEMA_VERSION, gameStateSchema } from '../../src/core/state/schema';
import { exportJson, importJson, summarizeSlot } from '../../src/core/state/save';
import { recordPlayDuration, recordPlayMinute } from '../../src/core/state/playTime';

const fresh = () => createNewGame({ name: 'ハル', grade: 3 });

describe('GameState', () => {
  it('プレイ時間を加算し、変更日時を更新する', () => {
    const state = fresh();
    state.learning.playSecondsByDate['2026-10-08'] = 120;

    const next = recordPlayMinute(state, '2026-10-08', 5_000);

    expect(next.learning.playSecondsByDate['2026-10-08']).toBe(180);
    expect(next.updatedAt).toBe(5_000);
    expect(state.learning.playSecondsByDate['2026-10-08']).toBe(120);
  });

  it('画面を表示していた秒数だけを加算する', () => {
    const state = fresh();

    const next = recordPlayDuration(state, '2026-10-08', 17, 5_000);

    expect(next.learning.playSecondsByDate['2026-10-08']).toBe(17);
    expect(next.updatedAt).toBe(5_000);
  });

  it('プレイ時間の合計が安全整数を超える更新は状態を壊さない', () => {
    const state = fresh();
    state.learning.playSecondsByDate['2026-10-08'] = Number.MAX_SAFE_INTEGER;

    expect(recordPlayDuration(state, '2026-10-08', 1, 5_000)).toBe(state);
    expect(state.learning.playSecondsByDate['2026-10-08']).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('新規ゲームがスキーマを満たす', () => {
    const state = fresh();
    expect(gameStateSchema.safeParse(state).success).toBe(true);
    expect(state.inventory['common-renshu-no-bou']).toBe(1);
  });
  it('安全整数を超える進行値をセーブデータとして受け入れない', () => {
    const state = fresh();
    state.player.gold = Number.MAX_SAFE_INTEGER + 1;
    expect(gameStateSchema.safeParse(state).success).toBe(false);
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
  it('巨大なインポートをJSON解析前に拒否する', () => {
    const oversized = `{"padding":"${'x'.repeat(5 * 1024 * 1024)}"}`;

    expect(() => importJson(oversized)).toThrow(/大きすぎ/);
  });
  it('現行バージョンはそのまま通る', () => {
    const r = migrate(fresh());
    expect(r.migratedFrom).toBeNull();
    expect(r.state.schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('v6 のセーブにバトル持ち込み用の空バッグを追加する', () => {
    const legacy = structuredClone(fresh()) as ReturnType<typeof fresh> & { schemaVersion: number };
    legacy.schemaVersion = 6;
    delete (legacy.party as Partial<typeof legacy.party>).bagItems;
    const migrated = migrate(legacy);
    expect(migrated.migratedFrom).toBe(6);
    expect(migrated.state.party.bagItems).toEqual([]);
    expect(migrated.state.progress.unlockedMonsters).toEqual(['aomori-itakodori']);
  });
  it('v7 のセーブでは旧版で出現済みだったモンスターを解放したまま移行する', () => {
    const legacy = structuredClone(fresh()) as ReturnType<typeof fresh> & { schemaVersion: number };
    legacy.schemaVersion = 7;
    delete (legacy.progress as Partial<typeof legacy.progress>).unlockedMonsters;
    const migrated = migrate(legacy);
    expect(migrated.migratedFrom).toBe(7);
    expect(migrated.state.progress.unlockedMonsters).toEqual(['aomori-itakodori']);
  });
  it('v8 の達成済み称号ミッションから称号を復元する', () => {
    const legacy = structuredClone(fresh()) as ReturnType<typeof fresh> & { schemaVersion: number };
    legacy.schemaVersion = 8;
    legacy.progress.missions['aomori-ms-04'] = { status: 'done', progress: 0 };
    delete (legacy.progress as Partial<typeof legacy.progress>).titles;
    const migrated = migrate(legacy);
    expect(migrated.migratedFrom).toBe(8);
    expect(migrated.state.progress.titles).toEqual(['ねぶた見習[みなら]い']);
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
  it('v3 の序盤セーブは主人公を3x3中央へ移し、未解放の装備を所持品へ戻す', () => {
    const legacy = structuredClone(fresh()) as ReturnType<typeof fresh> & { schemaVersion: number };
    legacy.schemaVersion = 3;
    legacy.party.bagPlacements.hero = { x: 0, y: 0, rotated: false };
    legacy.party.bagPlacements['eq:weapon'] = { x: 1, y: 0, rotated: false };
    legacy.player.equipment.weapon = 'aomori-nebuta-sword';
    const migrated = migrate(legacy).state;
    expect(migrated.party.bagPlacements.hero).toMatchObject({ x: 1, y: 1 });
    expect(migrated.party.bagPlacements['eq:weapon']).toBeUndefined();
    expect(migrated.player.equipment.weapon).toBeUndefined();
    expect(migrated.inventory['aomori-nebuta-sword']).toBe(1);
    expect(migrated.inventory['common-renshu-no-bou']).toBe(1);
  });
  it('v3 の装備返却で所持数が上限でもセーブを失わない', () => {
    const legacy = structuredClone(fresh()) as ReturnType<typeof fresh> & { schemaVersion: number };
    legacy.schemaVersion = 3;
    legacy.player.equipment.weapon = 'common-renshu-no-bou';
    legacy.inventory['common-renshu-no-bou'] = Number.MAX_SAFE_INTEGER;

    const migrated = migrate(legacy).state;

    expect(migrated.player.equipment.weapon).toBeUndefined();
    expect(migrated.inventory['common-renshu-no-bou']).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('v4 の序盤セーブに入門装備を1回だけ追加する', () => {
    const legacy = structuredClone(fresh()) as ReturnType<typeof fresh> & { schemaVersion: number };
    legacy.schemaVersion = 4;
    delete legacy.inventory['common-renshu-no-bou'];
    const migrated = migrate(legacy).state;
    expect(migrated.inventory['common-renshu-no-bou']).toBe(1);
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
