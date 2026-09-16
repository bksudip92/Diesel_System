# Supabase as Plain Postgres (DATABASE_URL only)

This backend treats Supabase as **nothing more than a hosted PostgreSQL server**.
It does not use Supabase Auth, PostgREST, Storage, Realtime, or Edge Functions,
and the mobile app never talks to Supabase directly — it only calls this backend
(`EXPO_PUBLIC_API_URL`), which connects to Postgres with `DATABASE_URL`.

## 1. Get the connection string

1. Supabase Dashboard → your project → **Project Settings → Database → Connection string**.
2. Use **Session pooler** mode (`db.<ref>.supabase.co:5432/postgres`, IPv4-compatible).
   - **Do not use Transaction pooler (port 6543)** for this backend: `fuel-logs` and
     `reports` use Prisma interactive transactions (`$transaction`), which break in
     transaction-pooling mode.
   - The **Direct connection** (`5432`) also works but may require IPv6 from your host;
     prefer the Session pooler URI.
3. The URI looks like:
   `postgresql://postgres:<DB_PASSWORD>@db.<ref>.supabase.co:5432/postgres`
   (use the `postgres` role — it owns the tables, so no RLS/GRANT issues; see §4).

## 2. Point the backend at it

```bash
cd backend
cp .env.example .env   # if you don't have one yet
```

Set in `backend/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@db.<ref>.supabase.co:5432/postgres
JWT_SECRET=<output of: openssl rand -base64 48>   # min 32 chars, required
```

`DATABASE_URL` is the **only** Supabase-related setting. No anon key, no service-role
key, no `SUPABASE_URL` — the repo has no `@supabase/*` dependency by design
(`backend/src/config/env.ts` requires only `DATABASE_URL` + JWT/CORS settings).

## 3. Create the schema

### Case A — fresh Supabase project (no tables yet)

```bash
cd backend
npm run db:deploy   # prisma migrate deploy — applies prisma/migrations/*, incl. tables + views
```

The baseline migration (`prisma/migrations/20260823000000_baseline/migration.sql`)
creates `vehicles`, `fuel_logs`, `monthly_reports`, `yearly_reports`, `users`,
`refresh_tokens`, indexes, foreign keys, **and** the two views the API reads:

- `vehicle_info` (used by `GET /vehicles/:number`)
- `fuel_logs_with_vehicle` (used by `GET /fuel-logs/last`)

### Case B — Supabase project already has these tables with live data

Do not run `migrate deploy` blindly — verify first, exactly as `prisma/schema.prisma` notes:

```bash
DATABASE_URL=<supabase-uri> npx prisma db pull   # introspect live schema
git diff prisma/schema.prisma                    # reconcile any drift
```

Then verify the views match (definitions must be identical or the two endpoints above
return wrong shapes):

```sql
SELECT pg_get_viewdef('vehicle_info'::regclass, true);
SELECT pg_get_viewdef('fuel_logs_with_vehicle'::regclass, true);
```

Compare against the `CREATE OR REPLACE VIEW` statements at the bottom of the baseline
`migration.sql`. If they differ, apply the migration's view definitions to Supabase
and mark the baseline as applied without re-running table DDL:

```bash
npx prisma migrate resolve --applied "20260823000000_baseline"
```

## 4. Permissions / RLS — what to (not) do

- The backend connects as `postgres` (table owner) → **RLS is bypassed automatically**.
  You do not need any RLS policies, because nothing goes through PostgREST.
- Do **not** enable RLS with restrictive policies on these tables unless you also use
  a non-owner role — that would break the backend. If your org mandates RLS, keep
  using the owner connection for the backend and add policies only for other roles.
- Do not create a Supabase Auth project configuration for this app: login is
  `POST /api/v1/auth/login` (bcrypt `password_hash` in `public.users` + app-issued
  JWT/refresh tokens in `refresh_tokens`).

## 5. Move existing data / users

- **Tables data** (from an old Supabase project into a new DB):
  ```bash
  export SUPABASE_DB_URL="postgresql://postgres:<pw>@db.<old-ref>.supabase.co:5432/postgres"
  ./prisma/scripts/export-from-supabase.sh   # writes prisma/data/supabase_data.sql
  npm run db:seed                            # loads it into DATABASE_URL
  ```
- **Users with passwords intact** (bcrypt hashes preserved, no resets):
  ```bash
  SUPABASE_DB_URL="<old project uri>" DATABASE_URL="<new DATABASE_URL>" npm run db:migrate-users
  ```
  Reads `auth.users` + `public.users` (place/name by email), idempotent.

## 6. Run and smoke-test

```bash
cd backend
npm run db:generate
npm start   # or npm run dev
curl localhost:3000/health
curl -X POST localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"…","password":"…"}'
```

Point the app at the backend (not at Supabase):

```dotenv
# frontend .env
EXPO_PUBLIC_API_URL=https://<your-backend-host>/api/v1
```

## 7. Supabase features you are deliberately ignoring

| Feature | Why unused |
|---|---|
| Supabase Auth (GoTrue) | App uses its own JWT access + rotating refresh tokens (`auth.*` modules) |
| PostgREST / Data API + RLS | All reads/writes go through Express + Prisma as owner |
| Storage | QR codes come from an external render API + on-device filesystem |
| Realtime | App polls via TanStack Query (`refetch` / invalidate) |
| Edge Functions / pg_cron | Aggregation is `POST /reports/monthly/refresh` on demand |

Operational notes: keep automated Supabase backups on (dashboard default), rotate the
DB password via Dashboard → Database settings (then update `DATABASE_URL` wherever
the backend runs), and never commit `backend/.env` (only `.env.example`).
