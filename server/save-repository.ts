import type { Pool } from 'pg';
import { cloudSlotSchema, type CloudWrite } from '../src/core/state/cloudProtocol';
import type { SlotId } from '../src/core/state/slots';
import type { SaveRepository } from './account-api';

export const SAVE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS nq_save (
  owner text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  slot integer NOT NULL CHECK (slot BETWEEN 1 AND 3),
  revision integer NOT NULL CHECK (revision > 0),
  mutation uuid NOT NULL,
  state jsonb,
  PRIMARY KEY (owner, slot)
);
CREATE TABLE IF NOT EXISTS nq_api_limit (
  owner text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  count integer NOT NULL
);`;
export const WRITE_SAVE_SQL = `
INSERT INTO nq_save (owner, slot, revision, mutation, state)
SELECT $1, $2, 1, $4, $5::jsonb WHERE $3 = 0
ON CONFLICT (owner, slot) DO NOTHING
RETURNING slot, revision, mutation, state`;
export function saveRepository(db: Pick<Pool, 'query'>): SaveRepository {
  return {
    async list(owner) {
      const { rows } = await db.query(
        'SELECT slot, revision, mutation, state FROM nq_save WHERE owner = $1 ORDER BY slot',
        [owner],
      );
      return rows.map((row) => cloudSlotSchema.parse(row));
    },
    async write(owner: string, slot: SlotId, value: CloudWrite) {
      const args = [
        owner,
        slot,
        value.revision,
        value.mutation,
        value.state === null ? null : JSON.stringify(value.state),
      ];
      const inserted = await db.query(WRITE_SAVE_SQL, args);
      if (inserted.rows[0]) return cloudSlotSchema.parse(inserted.rows[0]);
      // One statement arbitrates concurrent writers. A repeated mutation is an acknowledgement retry.
      const { rows } = await db.query(
        `UPDATE nq_save SET
        revision = CASE WHEN mutation = $4::uuid THEN revision ELSE revision + 1 END,
        state = CASE WHEN mutation = $4::uuid THEN state ELSE $5::jsonb END,
        mutation = $4
        WHERE owner = $1 AND slot = $2 AND (revision = $3 OR mutation = $4::uuid)
        RETURNING slot, revision, mutation, state`,
        args,
      );
      return rows[0] ? cloudSlotSchema.parse(rows[0]) : null;
    },
    async allow(owner) {
      const { rows } = await db.query(
        `INSERT INTO nq_api_limit (owner, starts_at, count) VALUES ($1, now(), 1)
        ON CONFLICT (owner) DO UPDATE SET
          count = CASE WHEN nq_api_limit.starts_at < now() - interval '1 minute' THEN 1 ELSE nq_api_limit.count + 1 END,
          starts_at = CASE WHEN nq_api_limit.starts_at < now() - interval '1 minute' THEN now() ELSE nq_api_limit.starts_at END
        RETURNING count`,
        [owner],
      );
      return rows[0].count <= 120;
    },
    async deleteAccount(owner) {
      await db.query('DELETE FROM "user" WHERE id = $1', [owner]);
    },
  };
}
