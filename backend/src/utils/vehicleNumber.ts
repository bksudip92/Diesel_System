import { z } from 'zod';

/**
 * Shared vehicle-number validation.
 *
 * The stored layout is not fixed: the `vehicle_info` rows use short forms such
 * as "KA-01-TEST" as well as full Indian plates like "KA-05-MJ-6100", and the
 * values arrive from QR scans whose casing and dash placement are not
 * guaranteed to match the row. So this deliberately constrains only the
 * character set and a length window rather than pinning one exact format.
 *
 * The point is to reject payloads that are plainly not vehicle numbers — a
 * stray character such as "UP-93-AB-1234!", a Wi-Fi config QR, an arbitrary
 * 1D barcode — with a 422, instead of letting them reach the database and come
 * back as a misleading "Vehicle not found" 404.
 */
export const vehicleNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/, 'must contain only letters, digits and dashes')
  .refine(
    (value) => {
      const compact = value.replace(/-/g, '');
      return (
        compact.length >= 4 &&
        compact.length <= 12 &&
        /[A-Za-z]/.test(compact) &&
        /[0-9]/.test(compact)
      );
    },
    { message: 'is not a valid vehicle number' },
  );

/** Canonical form used as a fallback comparison key: no dashes, uppercase. */
export function normalizeVehicleNumberKey(vehicleNumber: string): string {
  return vehicleNumber.replace(/-/g, '').toUpperCase();
}
