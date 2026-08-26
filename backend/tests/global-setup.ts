/**
 * Vitest global setup:
 *   1. Creates the throwaway test database if it doesn't exist.
 *   2. Applies every migration SQL file in order (fresh schema each run).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const TEST_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://diesel:diesel@localhost:5433/diesel_system_test';
const ADMIN_URL = new URL(TEST_URL);
ADMIN_URL.pathname = '/postgres';

export async function setup(): Promise<void> {
  const admin = new pg.Pool({ connectionString: ADMIN_URL.toString() });
  try {
    await admin.query('DROP DATABASE IF EXISTS diesel_system_test');
    await admin.query('CREATE DATABASE diesel_system_test');
  } finally {
    await admin.end();
  }

  const client = new pg.Client({ connectionString: TEST_URL });
  await client.connect();
  try {
    const migrationsDir = join(import.meta.dirname, '..', 'prisma', 'migrations');
    const migrations = readdirSync(migrationsDir)
      .filter((name) => !name.startsWith('_'))
      .sort();

    for (const migration of migrations) {
      const sql = readFileSync(join(migrationsDir, migration, 'migration.sql'), 'utf-8');
      await client.query(sql);
    }
  } finally {
    await client.end();
  }
}
