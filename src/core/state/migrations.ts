/**
 * セーブデータのマイグレーション。
 * 仕様変更でスキーマを変えるときは、必ずここに v(n) → v(n+1) を足す。子どものセーブを壊さない。
 */
import { SCHEMA_VERSION, gameStateSchema, type GameState } from './schema';

type Migration = (s: Record<string, unknown>) => Record<string, unknown>;

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
