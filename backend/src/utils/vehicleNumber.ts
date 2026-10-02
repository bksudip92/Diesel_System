import { z } from 'zod';

/**
 * Shared vehicle-number validation and normalisation.
 *
 * Vehicle numbers reach the API from QR/barcode scans, and neither their
 * casing nor their separator layout is guaranteed to match the stored row: a
 * code for `UP-92-AB-1234` may read back as `up-92-ab-1234`, `up92ab1234` or
 * `UP 92 AB 1234`.
 *
 * The stored layout is itself not fixed — `vehicles` holds short forms such as
 * `KA-01-TEST` alongside full plates such as `KA-05-MJ-6100` — so a scan can
 * never be *reformatted* into the stored string. Uppercasing is enough for the
 * common case but still misses `up92ab1234`. Normalisation is therefore split
 * into two distinct forms, and mixing them up is what allowed the two vehicle
 * lookups to disagree:
 *
 *   canonicalVehicleNumber()   Display/storage form: uppercase, with any run of
 *                              separators collapsed to a single dash. Applied at
 *                              the API boundary (via `vehicleNumberSchema`) so
 *                              that everything we store or echo back looks
 *                              consistent. Best-effort, never used for matching.
 *
 *   normalizeVehicleNumberKey() Comparison key: uppercase, alphanumerics only.
 *                              This is the separator- and case-proof form, and
 *                              the ONLY form a vehicle-number query may match
 *                              on. See `src/db/vehicleLookup.ts`, which is the
 *                              single place that turns a scan into a row lookup.
 *
 * The point of the schema is still to reject payloads that are plainly not
 * vehicle numbers — a stray `UP-93-AB-1234!`, a Wi-Fi config QR, an arbitrary
 * 1D barcode — with a 422, instead of letting them reach the database and come
 * back as a misleading `Vehicle not found` 404.
 */

/** Separators a scan may insert between the alphanumeric groups of a plate. */
const SEPARATOR_RUN = /[\s._-]+/g;

/** Characters accepted on input; anything else is a bad scan, not a plate. */
const ALLOWED_CHARACTERS = /^[A-Za-z0-9\s._-]+$/;

/** The stored keys run from `KA01TEST` (8) up to a full plate like `KA05MJ6100`. */
const KEY_LENGTH_MIN = 4;
const KEY_LENGTH_MAX = 12;

/**
 * Display/storage form: trims, collapses separator runs to single dashes and
 * uppercases. `up 92 ab 1234` and `up__92--ab--1234` both become
 * `UP-92-AB-1234`. Separators that are absent stay absent — `up92ab1234` is
 * left as-is rather than guessed at, because the stored layout is not knowable
 * from the input alone.
 */
export function canonicalVehicleNumber(vehicleNumber: string): string {
  return vehicleNumber.trim().replace(SEPARATOR_RUN, '-').toUpperCase();
}

/**
 * Comparison key: uppercase with every non-alphanumeric character removed.
 * `up-92-ab-1234`, `UP92AB1234` and `up 92 ab 1234` all collapse to
 * `UP92AB1234`, which is what makes matching them equivalent.
 *
 * Mirrored in Postgres by `VEHICLE_NUMBER_KEY_SQL`; the two must stay in sync.
 */
export function normalizeVehicleNumberKey(vehicleNumber: string): string {
  return vehicleNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Validates a scanned/stored vehicle number and returns it in canonical form,
 * so every value that reaches a service is already uppercased and dash-tidy.
 */
export const vehicleNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(ALLOWED_CHARACTERS, 'must contain only letters, digits and separators')
  .transform(canonicalVehicleNumber)
  .refine(
    (canonical) => {
      const key = normalizeVehicleNumberKey(canonical);
      return (
        key.length >= KEY_LENGTH_MIN &&
        key.length <= KEY_LENGTH_MAX &&
        /[A-Za-z]/.test(key) &&
        /[0-9]/.test(key)
      );
    },
    { message: 'is not a valid vehicle number' },
  );