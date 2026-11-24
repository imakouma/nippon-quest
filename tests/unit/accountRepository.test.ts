import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import type { Pool } from 'pg';
import { SAVE_TABLE_SQL, saveRepository } from '../../server/save-repository';
import { createNewGame } from '../../src/core/state/newGame';
const db = new PGlite();
// PGlite implements PostgreSQL query/parameters; the repository only consumes rows.
const repository = saveRepository({
  query: (sql: string, values?: unknown[]) => db.query(sql, values),
} as Pick<Pool, 'query'>);
const value = () => ({
  revision: 0,
  mutation: crypto.randomUUID(),
  state: createNewGame({ name: 'ハル', grade: 3 }),
});
beforeAll(async () => {
  await db.exec(
    'CREATE TABLE "user" (id text PRIMARY KEY); INSERT INTO "user" VALUES (\'alice\'), (\'bob\');',
  );
  await db.exec(SAVE_TABLE_SQL);
}, 60_000);
afterAll(() => db.close());
describe('PostgreSQL cloud saves', () => {
  it('enforces ownership and atomic revision conflicts', async () => {
    const first = await repository.write('alice', 1, value());
    expect(first?.revision).toBe(1);
    expect(await repository.list('bob')).toEqual([]);
    expect(await repository.write('alice', 1, value())).toBeNull();
    const edit = { ...value(), revision: 1 };
    const results = await Promise.all([
      repository.write('alice', 1, edit),
      repository.write('alice', 1, { ...edit, mutation: crypto.randomUUID() }),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await repository.write('alice', 1, edit))?.revision).toBe(2);
  });
  it('does not resurrect deleted slots with a stale revision', async () => {
    await repository.write('alice', 2, value());
    expect((await repository.write('alice', 2, { ...value(), revision: 1, state: null }))?.revision).toBe(2);
    expect(await repository.write('alice', 2, { ...value(), revision: 1 })).toBeNull();
    expect((await repository.list('alice')).find((s) => s.slot === 2)?.state).toBeNull();
  });
  it('deletes all owned rows with the account', async () => {
    await repository.write('bob', 1, value());
    await repository.allow('bob');
    await repository.deleteAccount('bob');
    expect(await repository.list('bob')).toEqual([]);
    expect((await repository.list('alice')).length).toBeGreaterThan(0);
    expect((await db.query('SELECT * FROM nq_api_limit WHERE owner = $1', ['bob'])).rows).toEqual([]);
  });
});
