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
