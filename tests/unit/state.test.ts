import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { migrate } from '../../src/core/state/migrations';
import { SCHEMA_VERSION, gameStateSchema } from '../../src/core/state/schema';
import { normalizeLevelCaps } from '../../src/core/state/levelCaps';
import { exportJson, importJson, summarizeSlot } from '../../src/core/state/save';
import { recordPlayDuration, recordPlayMinute } from '../../src/core/state/playTime';

const fresh = () => createNewGame({ name: 'ハル', grade: 3 });

type LegacyV9State = {
  schemaVersion: number;
  player: {
    baseStats: { hp: number; mp: number; atk: number; def: number; spd: number; wis: number };
    hp: number;
    mp: number;
  };
};

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
    expect(state.player.levelCap).toBe(10);
    expect(state.learning.masteredRewardUnits).toEqual([]);
    expect(state.learning.correctedRewardQuestionIds).toEqual([]);
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
  it('v9 の能力を文理能力へ移行し、現在HP・MP割合を保つ', () => {
    const source = fresh();
    source.player.equipment.weapon = 'common-renshu-no-bou';
    source.party.owned.push({
      uid: 'pal-1',
      monsterId: 'aomori-ringoron',
      level: 3,
      levelCap: 10,
      xp: 12,
    });
    source.party.activeUid = 'pal-1';
    source.party.team = ['pal-1'];
    source.learning.mastery['sansu:addition'] = { value: 0.75, n: 4, lastAt: 1234 };
    const preserved = {
      equipment: structuredClone(source.player.equipment),
      party: structuredClone(source.party),
      learning: structuredClone(source.learning),
    };
    const legacyWithoutCaps = structuredClone(source);
    delete (legacyWithoutCaps.party.owned[0] as { levelCap?: number }).levelCap;
    const legacy = legacyWithoutCaps as unknown as LegacyV9State;
    legacy.schemaVersion = 9;
    legacy.player.baseStats = {
      hp: 40,
      mp: 10,
      atk: 8,
      def: 6,
      spd: 7,
      wis: 5,
    };
    legacy.player.hp = 20;
    legacy.player.mp = 5;
    const migrated = migrate(legacy).state;
    expect(migrated.player.baseStats).toEqual({
      hp: 24,
      mp: 6,
      scienceAtk: 5,
      humanitiesAtk: 5,
      scienceDef: 4,
      humanitiesDef: 4,
      spd: 5,
      wis: 3,
    });
    expect(migrated.player.hp).toBe(12);
    expect(migrated.player.mp).toBe(3);
    expect(migrated.player.equipment).toEqual(preserved.equipment);
    expect(migrated.party).toEqual(preserved.party);
    expect(migrated.learning).toEqual(preserved.learning);
    expect(migrate(migrated).state).toEqual(migrated);
  });
  it('v10 の進行を保ったまま個体上限と学習報酬履歴を追加する', () => {
    const legacy = structuredClone(fresh()) as ReturnType<typeof fresh> & { schemaVersion: number };
    legacy.schemaVersion = 10;
    legacy.player.level = 37;
    legacy.player.xp = 12_345;
    legacy.player.equipment.weapon = 'common-renshu-no-bou';
    legacy.party.owned = [
      {
        uid: 'same-uid',
        monsterId: 'aomori-ringoron',
        nickname: 'リン',
        level: 12,
        levelCap: 20,
        xp: 678,
      },
    ];
    legacy.dex.monsters = ['aomori-ringoron'];
    legacy.inventory['aomori-ringo'] = 4;
    legacy.learning.mastery['sansu.g1'] = { value: 0.9, n: 8, lastAt: 123 };
    delete (legacy.player as Partial<typeof legacy.player>).levelCap;
    delete (legacy.learning as Partial<typeof legacy.learning>).masteredRewardUnits;
    delete (legacy.learning as Partial<typeof legacy.learning>).correctedRewardQuestionIds;
    delete (legacy.party.owned[0] as Partial<(typeof legacy.party.owned)[number]>).levelCap;

    const migrated = migrate(legacy);

    expect(migrated.migratedFrom).toBe(10);
    expect(migrated.state.schemaVersion).toBe(11);
    expect(migrated.state.player).toMatchObject({ level: 37, xp: 12_345, levelCap: 40 });
    expect(migrated.state.party.owned).toEqual([
      {
        uid: 'same-uid',
        monsterId: 'aomori-ringoron',
        nickname: 'リン',
        level: 12,
        xp: 678,
        levelCap: 20,
      },
    ]);
    expect(migrated.state.player.equipment.weapon).toBe('common-renshu-no-bou');
    expect(migrated.state.dex.monsters).toEqual(['aomori-ringoron']);
    expect(migrated.state.inventory['aomori-ringo']).toBe(4);
    expect(migrated.state.learning.mastery['sansu.g1']).toEqual({ value: 0.9, n: 8, lastAt: 123 });
    expect(migrated.state.learning.masteredRewardUnits).toEqual([]);
    expect(migrated.state.learning.correctedRewardQuestionIds).toEqual([]);
    expect(migrate(migrated.state)).toEqual({ state: migrated.state, migratedFrom: null });
  });
  it('読込後の上限を現在レベルと種族初期上限の大きい方へ一度だけ正規化する', () => {
    const state = fresh();
    state.player.level = 37;
    state.player.levelCap = 40;
    state.party.owned = [
      {
        uid: 'same-uid',
        monsterId: 'aomori-ringoron',
        level: 12,
        xp: 678,
        levelCap: 20,
      },
    ];
    const monsters = new Map([['aomori-ringoron', { initialLevelCap: 40 }]]);

    const normalized = normalizeLevelCaps(state, monsters, 10);

    expect(normalized.player.levelCap).toBe(40);
    expect(normalized.party.owned[0]?.levelCap).toBe(40);
    expect(normalizeLevelCaps(normalized, monsters, 10)).toBe(normalized);
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
