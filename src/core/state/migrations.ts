/**
 * セーブデータのマイグレーション。
 * 仕様変更でスキーマを変えるときは、必ずここに v(n) → v(n+1) を足す。子どものセーブを壊さない。
 */
import { SCHEMA_VERSION, gameStateSchema, type GameState } from './schema';
import { STARTER_EQUIPMENT_ID } from './starter';
import { addProgressValue } from '../../shared/safeInteger';

type Migration = (s: Record<string, unknown>) => Record<string, unknown>;

// v7 までは解放条件を抽選へ反映しておらず、イタコドリは最初から出現していた。
// アップデートで既存プレイヤーの出現候補を減らさないため、旧セーブでは解放済みとして引き継ぐ。
const LEGACY_UNLOCKED_MONSTERS = ['aomori-itakodori'];
const NEBUTA_APPRENTICE_TITLE = 'ねぶた見習[みなら]い';

/** index = 移行元バージョン。migrations[1] は v1 → v2 */
const migrations: Record<number, Migration> = {
  1: (s) => {
    const party = (s.party ?? {}) as Record<string, unknown>;
    const team = Array.isArray(party.team) ? (party.team as string[]) : [];
    const placements: Record<string, { x: number; y: number; rotated: boolean }> = {
      hero: { x: 0, y: 0, rotated: false },
    };
    // 古い一次元バッグは、2x2へ入る分を左上から自動配置。残りは控えへ移す。
    const cells: Array<[number, number]> = [
      [1, 0],
      [0, 1],
      [1, 1],
    ];
    const placed = team.slice(0, cells.length);
    placed.forEach((uid, i) => {
      const [x, y] = cells[i]!;
      placements[`mon:${uid}`] = { x, y, rotated: false };
    });
    return {
      ...s,
      schemaVersion: 2,
      party: {
        ...party,
        team: placed,
        reserve: team.slice(cells.length, 7),
        bagPlacements: placements,
      },
    };
  },
  2: (s) => {
    const learning = (s.learning ?? {}) as Record<string, unknown>;
    return {
      ...s,
      schemaVersion: 3,
      learning: {
        ...learning,
        attempts: Array.isArray(learning.attempts) ? learning.attempts : [],
        conceptStates:
          learning.conceptStates && typeof learning.conceptStates === 'object' ? learning.conceptStates : {},
      },
    };
  },
  3: (s) => {
    const progress = (s.progress ?? {}) as Record<string, unknown>;
    const party = (s.party ?? {}) as Record<string, unknown>;
    const player = (s.player ?? {}) as Record<string, unknown>;
    const placements = { ...((party.bagPlacements ?? {}) as Record<string, unknown>) };
    placements.hero = { x: 1, y: 1, rotated: false };
    const cleared = Array.isArray(progress.islandsCleared) && progress.islandsCleared.includes('tohoku');
    const equipment = { ...((player.equipment ?? {}) as Record<string, string>) };
    const inventory = { ...((s.inventory ?? {}) as Record<string, number>) };
    if (!cleared) {
      for (const [slot, id] of Object.entries(equipment)) {
        inventory[id] = addProgressValue(inventory[id] ?? 0, 1);
        delete placements[`eq:${slot}`];
      }
      for (const slot of Object.keys(equipment)) delete equipment[slot];
    }
    return {
      ...s,
      schemaVersion: 4,
      inventory,
      player: { ...player, equipment },
      party: { ...party, bagPlacements: placements },
    };
  },
  4: (s) => {
    const progress = (s.progress ?? {}) as Record<string, unknown>;
    const player = (s.player ?? {}) as Record<string, unknown>;
    const equipment = (player.equipment ?? {}) as Record<string, string>;
    const inventory = { ...((s.inventory ?? {}) as Record<string, number>) };
    const cleared = Array.isArray(progress.islandsCleared) && progress.islandsCleared.includes('tohoku');
    if (!cleared && equipment.weapon !== STARTER_EQUIPMENT_ID && !inventory[STARTER_EQUIPMENT_ID]) {
      inventory[STARTER_EQUIPMENT_ID] = 1;
    }
    return { ...s, schemaVersion: 5, inventory };
  },
  5: (s) => {
    const player = (s.player ?? {}) as Record<string, unknown>;
    const appearance = (player.appearance ?? {}) as Record<string, unknown>;
    return {
      ...s,
      schemaVersion: 6,
      player: { ...player, appearance: { hairStyle: 0, eyes: 0, ...appearance } },
    };
  },
  6: (s) => {
    const party = (s.party ?? {}) as Record<string, unknown>;
    return { ...s, schemaVersion: 7, party: { ...party, bagItems: [] } };
  },
  7: (s) => {
    const progress = (s.progress ?? {}) as Record<string, unknown>;
    return {
      ...s,
      schemaVersion: 8,
      progress: { ...progress, unlockedMonsters: LEGACY_UNLOCKED_MONSTERS },
    };
  },
  8: (s) => {
    const progress = (s.progress ?? {}) as Record<string, unknown>;
    const missions = (progress.missions ?? {}) as Record<string, { status?: unknown }>;
    const titles = missions['aomori-ms-04']?.status === 'done' ? [NEBUTA_APPRENTICE_TITLE] : [];
    return { ...s, schemaVersion: 9, progress: { ...progress, titles } };
  },
};

export interface MigrateResult {
  state: GameState;
  migratedFrom: number | null;
}

export function migrate(raw: unknown): MigrateResult {
  const obj = raw as Record<string, unknown>;
  const from = typeof obj?.schemaVersion === 'number' ? obj.schemaVersion : 0;
  if (from > SCHEMA_VERSION)
    throw new Error(`新しすぎるセーブデータです（v${from}）。アプリを更新してください。`);
  let cur = obj;
  for (let v = from; v < SCHEMA_VERSION; v++) {
    const m = migrations[v];
    if (!m) throw new Error(`v${v} → v${v + 1} のマイグレーションがありません`);
    cur = m(cur);
  }
  const parsed = gameStateSchema.safeParse(cur);
  if (!parsed.success)
    throw new Error(
      `セーブデータが壊れています: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`,
    );
  return { state: parsed.data, migratedFrom: from === SCHEMA_VERSION ? null : from };
}
