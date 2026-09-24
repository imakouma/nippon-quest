/**
 * セーブデータのマイグレーション。
 * 仕様変更でスキーマを変えるときは、必ずここに v(n) → v(n+1) を足す。子どものセーブを壊さない。
 */
import { SCHEMA_VERSION, gameStateSchema, type GameState } from './schema';

type Migration = (s: Record<string, unknown>) => Record<string, unknown>;

/** index = 移行元バージョン。migrations[1] は v1 → v2 */
const migrations: Record<number, Migration> = {
  // 例：
  // 1: (s) => ({ ...s, schemaVersion: 2, arena: { badges: 0, ghostParty: null, ...(s.arena as object) } }),
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
