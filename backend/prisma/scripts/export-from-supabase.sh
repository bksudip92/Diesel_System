#!/usr/bin/env bash
# Exports schema + data from the Supabase project into prisma/data/.
#
# Usage:
#   export SUPABASE_DB_URL="postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres"
#   ./prisma/scripts/export-from-supabase.sh
set -euo pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL to your Supabase Postgres connection string}"
OUT_DIR="$(dirname "$0")/../data"
mkdir -p "$OUT_DIR"

TABLES="--table=vehicles --table=fuel_logs --table=monthly_reports --table=yearly_reports"

echo "Exporting schema..."
pg_dump --schema-only --no-owner --no-privileges $TABLES \
  "$SUPABASE_DB_URL" > "$OUT_DIR/supabase_schema.sql"

echo "Exporting data..."
pg_dump --data-only $TABLES --column-inserts --no-owner --no-privileges \
  "$SUPABASE_DB_URL" > "$OUT_DIR/supabase_data.sql"

echo ""
echo "Done. Files written:"
ls -la "$OUT_DIR"
echo ""
echo "Next steps:"
echo "  1. Compare supabase_schema.sql with backend/prisma/schema.prisma and reconcile differences."
echo "  2. npm run db:migrate   (apply baseline migration locally)"
echo "  3. npm run db:seed      (load exported data)"
