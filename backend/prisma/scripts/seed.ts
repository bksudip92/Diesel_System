/**
 * Seeds the local development database with data exported from Supabase.
 *
 * Prerequisites — export the production data once from Supabase:
 *   pg_dump --data-only \
 *     --table=vehicles --table=fuel_logs --table=monthly_reports \
 *     --table=yearly_reports --table=users \
 *     --column-inserts --no-owner --no-privileges \
 *     "$SUPABASE_DB_URL" > prisma/data/supabase_data.sql
 *
 * Then run: npm run db:seed
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const DATA_FILE = join(import.meta.dirname, 'data', 'supabase_data.sql');
const INSERT_PATTERN = /-- Data for Name: (vehicles|fuel_logs|monthly_reports|yearly_reports|users);/;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const connectionString = requireEnv('DATABASE_URL');

  if (!existsSync(DATA_FILE)) {
    console.error(
      `Data dump not found at ${DATA_FILE}.\n` +
        `Export it from Supabase first (see instructions at the top of this file).`,
    );
    process.exit(1);
  }

  const dump = readFileSync(DATA_FILE, 'utf-8');

  if (!INSERT_PATTERN.test(dump)) {
    throw new Error('Dump does not look like a pg_dump --data-only export. Aborting.');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // Apply the raw SQL dump inside a transaction; fails atomically on error.
    await prisma.$transaction([prisma.$executeRawUnsafe(dump)]);
    console.log('Seed applied successfully.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
