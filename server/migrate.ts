import { Pool } from 'pg';
import { getMigrations } from 'better-auth/db/migration';
import { authOptions } from './auth';
import { SAVE_TABLE_SQL } from './save-repository';

const db = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const migrations = await getMigrations(authOptions(db, process.env));
  await migrations.runMigrations();
  await db.query(SAVE_TABLE_SQL);
  console.info('Account database is ready.');
} finally {
  await db.end();
}
