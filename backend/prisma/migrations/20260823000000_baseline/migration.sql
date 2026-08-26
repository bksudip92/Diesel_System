-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "vehicles" (
    "vehicle_id" SERIAL NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_name" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "vehicle_class" TEXT NOT NULL,
    "owner_name" TEXT,
    "department" TEXT,
    "organization" TEXT,
    "place" TEXT,
    "current_meter_reading" DOUBLE PRECISION NOT NULL,
    "permitted_liters" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateTable
CREATE TABLE "fuel_logs" (
    "id" SERIAL NOT NULL,
    "vehicle_id_fk" INTEGER NOT NULL,
    "meter_reading" DOUBLE PRECISION NOT NULL,
    "previous_meter_reading" DOUBLE PRECISION NOT NULL,
    "calculated_distance" DOUBLE PRECISION NOT NULL,
    "filled_liters" DOUBLE PRECISION NOT NULL,
    "calculated_efficiency" DOUBLE PRECISION,
    "transaction_date" TEXT NOT NULL,
    "transaction_time" TEXT NOT NULL,
    "transaction_timestamp" TEXT NOT NULL,
    "place" TEXT NOT NULL,

    CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" SERIAL NOT NULL,
    "month_name" TEXT NOT NULL,
    "total_diesel" DOUBLE PRECISION NOT NULL,
    "total_fills" INTEGER NOT NULL,
    "first_date" TEXT NOT NULL,
    "last_date" TEXT NOT NULL,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yearly_reports" (
    "id" SERIAL NOT NULL,
    "year_name" TEXT NOT NULL,
    "total_diesel" DOUBLE PRECISION NOT NULL,
    "total_fills" INTEGER NOT NULL,
    "first_date" TEXT NOT NULL,
    "last_date" TEXT NOT NULL,

    CONSTRAINT "yearly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicle_number_key" ON "vehicles"("vehicle_number");

-- CreateIndex
CREATE INDEX "fuel_logs_place_idx" ON "fuel_logs"("place");

-- CreateIndex
CREATE INDEX "fuel_logs_transaction_date_idx" ON "fuel_logs"("transaction_date");

-- CreateIndex
CREATE INDEX "fuel_logs_vehicle_id_fk_idx" ON "fuel_logs"("vehicle_id_fk");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_month_name_key" ON "monthly_reports"("month_name");

-- CreateIndex
CREATE UNIQUE INDEX "yearly_reports_year_name_key" ON "yearly_reports"("year_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_vehicle_id_fk_fkey" FOREIGN KEY ("vehicle_id_fk") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Views (mirror the Supabase definitions used by the mobile app)
--
-- NOTE: Verify these match the production definitions before cutover:
--   SELECT pg_get_viewdef('vehicle_info'::regclass, true);
--   SELECT pg_get_viewdef('fuel_logs_with_vehicle'::regclass, true);
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW "vehicle_info" AS
SELECT
    v.vehicle_id,
    v.vehicle_number,
    v.vehicle_name,
    v.vehicle_type,
    v.vehicle_class,
    v.owner_name,
    v.department,
    v.organization,
    v.place,
    v.current_meter_reading,
    v.permitted_liters
FROM "vehicles" v;

CREATE OR REPLACE VIEW "fuel_logs_with_vehicle" AS
SELECT
    f.id,
    f.vehicle_id_fk,
    f.meter_reading,
    f.previous_meter_reading,
    f.calculated_distance,
    f.filled_liters,
    f.calculated_efficiency,
    f.transaction_date,
    f.transaction_time,
    f.transaction_timestamp,
    f.place,
    v.vehicle_number
FROM "fuel_logs" f
JOIN "vehicles" v ON v.vehicle_id = f.vehicle_id_fk;
