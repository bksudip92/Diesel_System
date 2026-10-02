import { Prisma } from '../generated/prisma/client.js';
import type { PrismaClient } from '../generated/prisma/client.js';
import { UnprocessableEntityError } from '../utils/appError.js';
import { canonicalVehicleNumber, normalizeVehicleNumberKey } from '../utils/vehicleNumber.js';

/**
 * The single place where a scanned vehicle number becomes a database lookup.
 *
 * Every vehicle-number query in the API goes through here. That is the point:
 * lookups were previously written out independently, one of them compared
 * `vehicle_number` exactly while its two siblings retried with a
 * case/separator-insensitive comparison. A scan of `up-92-ab-1234` therefore
 * resolved on `GET /vehicles/:number` and `GET /fuel-logs/last`, then failed
 * `POST /fuel-logs` with `Unknown vehicle` for the same vehicle in the same
 * breath. One resolver, one matching rule, no drift.
 */

/**
 * Postgres expression mirroring `normalizeVehicleNumberKey`: drop every
 * non-alphanumeric character, then uppercase. It must stay in step with that
 * function or the JS and SQL halves will silently disagree about which scans
 * are equivalent.
 *
 * Column name is fixed rather than parameterised on purpose — this is raw SQL,
 * so nothing derived from user input may reach it.
 */
export const VEHICLE_NUMBER_KEY_SQL = Prisma.sql`UPPER(REGEXP_REPLACE("vehicle_number", '[^A-Za-z0-9]', '', 'g'))`;

/**
 * `vehicles` for writes (the base table, so rows can be locked);
 * `vehicle_info` for reads, preserving parity with the legacy Supabase path.
 */
const SOURCES = {
  vehicles: Prisma.raw('"vehicles"'),
  vehicle_info: Prisma.raw('"vehicle_info"'),
} as const;

export type VehicleSource = keyof typeof SOURCES;

export interface VehicleLookupOptions {
  /** Defaults to the base table. */
  source?: VehicleSource;
  /**
   * Locks the matched row for the rest of the transaction so a concurrent
   * read-modify-write (e.g. deriving distance from the current meter) cannot
   * interleave and compute the same delta twice.
   */
  forUpdate?: boolean;
}

/** Columns `FuelLogsService.create` needs; also a safe default shape. */
export interface VehicleLookupRow {
  vehicle_id: number;
  vehicle_number: string;
  current_meter_reading: number;
}

/**
 * Resolves a scanned vehicle number to its stored row, or `null` when no
 * vehicle matches. Tolerates any casing and any dash/space/dot/underscore
 * layout, because the second query compares normalised keys.
 *
 * @throws {UnprocessableEntityError} if the key matches more than one stored
 * vehicle. Picking one arbitrarily would post fuel against the wrong truck, so
 * this is surfaced rather than guessed.
 */
export async function findVehicleByNumber<T extends { vehicle_number: string }>(
  client: PrismaClient | Prisma.TransactionClient,
  vehicleNumber: string,
  options: VehicleLookupOptions = {},
): Promise<T | null> {
  const source = SOURCES[options.source ?? 'vehicles'];
  const lock = options.forUpdate ? Prisma.sql`FOR UPDATE` : Prisma.empty;

  // Fast path. The unique index on vehicles_vehicle_number_key serves it, and
  // the boundary canonicalisation means a well-formed scan lands here.
  const exact = await client.$queryRaw<T[]>(Prisma.sql`
    SELECT * FROM ${source}
    WHERE "vehicle_number" = ${canonicalVehicleNumber(vehicleNumber)}
    LIMIT 1 ${lock}`);
  if (exact[0]) return exact[0];

  // Slow path. Unindexable (the key is computed), but only reached for scans
  // whose layout differs from the stored row.
  const key = normalizeVehicleNumberKey(vehicleNumber);
  const fuzzy = await client.$queryRaw<T[]>(Prisma.sql`
    SELECT * FROM ${source}
    WHERE ${VEHICLE_NUMBER_KEY_SQL} = ${key}
    ORDER BY "vehicle_number"
    LIMIT 2 ${lock}`);

  if (fuzzy.length > 1) {
    throw new UnprocessableEntityError(
      `'${vehicleNumber}' matches more than one vehicle ` +
        `(${fuzzy.map((row) => row.vehicle_number).join(', ')}). Use the exact number.`,
    );
  }

  return fuzzy[0] ?? null;
}