/**
 * Migrates users from Supabase auth into the backend `users` table,
 * preserving their bcrypt password hashes so nobody has to reset a password.
 *
 * Usage:
 *   SUPABASE_DB_URL="postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres" \
 *     npm run db:migrate-users
 *
 * Notes:
 *  - Reads auth.users (email, encrypted_password, raw_user_meta_data).
 *  - Profile attributes (place/name) fall back to the app's public.users
 *    table when present, keyed by email.
 *  - Idempotent: re-running updates password_hash for existing rows.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as BackendClient } from '../src/generated/prisma/client.js';
import pg from 'pg';

interface SupabaseAuthUser {
  id: string;
  email: string | null;
  encrypted_password: string | null;
}

interface SupabaseProfile {
  email: string;
  place?: string;
  name?: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const supabaseUrl = requireEnv('SUPABASE_DB_URL');
  const databaseUrl = requireEnv('DATABASE_URL');

  const pool = new pg.Pool({ connectionString: supabaseUrl, max: 2 });

  try {
    const { rows: authUsers } = await pool.query<SupabaseAuthUser>(
      `SELECT id, email, encrypted_password FROM auth.users WHERE email IS NOT NULL`,
    );
    const { rows: profiles } = await pool.query<SupabaseProfile>(
      `SELECT email, place, name FROM public.users`,
    ).catch(() => ({ rows: [] as SupabaseProfile[] }));

    const profileByEmail = new Map(profiles.map((p) => [p.email.toLowerCase(), p]));
    console.log(`Found ${authUsers.length} Supabase auth user(s).`);

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    const prisma = new BackendClient({ adapter });

    let imported = 0;
    for (const u of authUsers) {
      if (!u.email) continue;
      const profile = profileByEmail.get(u.email.toLowerCase());

      await prisma.user.upsert({
        where: { id: u.id },
        create: {
          id: u.id,
          email: u.email.toLowerCase(),
          place: profile?.place ?? '',
          name: profile?.name ?? null,
          password_hash: u.encrypted_password ?? null,
        },
        update: {
          email: u.email.toLowerCase(),
          ...(profile?.place !== undefined ? { place: profile.place } : {}),
          ...(profile?.name !== undefined ? { name: profile.name } : {}),
          ...(u.encrypted_password ? { password_hash: u.encrypted_password } : {}),
        },
      });
      imported++;
    }

    // Users that exist only in public.users (no auth account) get no password;
    // they can be granted one later by an admin flow.
    for (const [email, profile] of profileByEmail) {
      const exists = await prisma.user.findUnique({
        where: { id: `${authUsers.find((u) => u.email?.toLowerCase() === email)?.id ?? ''}` },
      });
      if (!exists && !authUsers.some((u) => u.email?.toLowerCase() === email)) {
        const { randomUUID } = await import('node:crypto');
        await prisma.user.upsert({
          where: { email },
          create: {
            id: randomUUID(),
            email,
            place: profile.place ?? '',
            name: profile.name ?? null,
            password_hash: null,
          },
          update: {},
        });
        imported++;
      }
    }

    console.log(`Imported/updated ${imported} user(s).`);
    await prisma.$disconnect();
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('User migration failed:', err);
  process.exit(1);
});
