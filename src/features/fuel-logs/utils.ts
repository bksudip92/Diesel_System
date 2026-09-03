/**
 * Fuel-log domain helpers: distance/efficiency math and form validation.
 * Previously inlined (and inconsistently) inside fill-fuel.tsx.
 */

/** Distance since the previous reading; 0 when the reading didn't advance. */
export function calculateDistance(newReading: number, previousReading: number): number {
  return newReading > previousReading ? newReading - previousReading : 0;
}

/** km/L, rounded to 2 decimals; 0 when inputs are not positive. */
export function calculateEfficiency(distance: number, liters: number): number {
  if (distance <= 0 || liters <= 0) return 0;
  return Math.round((distance / liters) * 100) / 100;
}

export type FuelLogValidation =
  | { ok: true; meterReading: number; filledLiters: number }
  | { ok: false; message: string };

/** Validates the fill-fuel form. Returns a user-facing message on failure. */
export function validateFuelLogInput(
  meterReadingRaw: string,
  filledLitersRaw: string,
  previousReading: number,
): FuelLogValidation {
  const meterReading = Number.parseFloat(meterReadingRaw);
  if (!Number.isFinite(meterReading) || meterReading <= 0) {
    return { ok: false, message: 'Please enter a valid meter reading' };
  }
  if (meterReading <= previousReading) {
    return {
      ok: false,
      message: 'New meter reading must be greater than previous reading',
    };
  }
  const filledLiters = Number.parseFloat(filledLitersRaw);
  if (!Number.isFinite(filledLiters) || filledLiters <= 0) {
    return { ok: false, message: 'Filled liters must be greater than 0' };
  }
  return { ok: true, meterReading, filledLiters };
}
