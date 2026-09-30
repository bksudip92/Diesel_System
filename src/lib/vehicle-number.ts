/**
 * Indian vehicle-number normalization. Previously copy-pasted (with a bug)
 * in `new-vehicle.tsx` and `type_vehcileNumber.tsx`.
 *
 * Accepts "ka05mj6100", "KA-05-MJ-6100", "ka 05 mj 6100" … and returns
 * the canonical dashed form "KA-05-MJ-6100", or null when invalid.
 */

/** Length of a normalized vehicle number without dashes (e.g. KA05MJ6100). */
export const VEHICLE_NUMBER_LENGTH = 10;

export function normalizeVehicleNumber(raw: string): string | null {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length !== VEHICLE_NUMBER_LENGTH) return null;

  const dashed = clean.replace(
    /^([A-Z0-9]{2})([A-Z0-9]{2})([A-Z0-9]{2})([A-Z0-9]{4})$/,
    '$1-$2-$3-$4',
  );
  return dashed;
}

export function isValidVehicleNumber(raw: string): boolean {
  return normalizeVehicleNumber(raw) !== null;
}

/**
 * Permissive plate check used on the QR-scan path.
 *
 * `normalizeVehicleNumber` hard-codes the 10-character Indian plate shape
 * (e.g. "KA-05-MJ-6100"), but rows already in the database use a shorter
 * form such as "KA-01-TEST" — so the strict helper would reject QR codes
 * this app itself issued. This check therefore only enforces that the
 * payload is plate-shaped, without pinning a length:
 *
 *   - letters, digits and dashes only (rejects stray payloads such as
 *     "UP-93-AB-1234!" or a Wi-Fi config QR),
 *   - at least one letter and one digit,
 *   - 4-12 characters once separators are removed.
 *
 * Returns the trimmed payload unchanged so the caller keeps whatever dash
 * layout the database uses; matching is made separator/case-insensitive on
 * the server instead of being guessed here.
 */
export function sanitizeScannedVehicleNumber(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^[A-Za-z0-9-]+$/.test(trimmed)) return null;

  const compact = trimmed.replace(/-/g, '');
  if (compact.length < 4 || compact.length > 12) return null;
  if (!/[A-Za-z]/.test(compact) || !/[0-9]/.test(compact)) return null;

  return trimmed;
}
