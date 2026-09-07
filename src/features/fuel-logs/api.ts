import { apiFetch } from '@/src/lib/api-client';
import type { FuelLog, FuelLogFlat, FuelLogWithVehicle } from '@/src/types/models';

/**
 * Fuel-logs feature API.
 */

export interface CreateFuelLogInput {
  vehicle_number: string;
  meter_reading: number;
  filled_liters: number;
  place: string;
  transaction_date: string;
  transaction_time: string;
}

/** Recent logs for the Dashboard, scoped to the user's place. */
export async function getRecentLogs(place: string, limit = 10): Promise<FuelLogFlat[]> {
  return apiFetch<FuelLogFlat[]>(
    `/fuel-logs/recent?place=${encodeURIComponent(place)}&limit=${limit}`,
  );
}

/** Latest log for a vehicle (used to compute distance on the fill-fuel form). */
export async function getLastFuelLog(vehicleNumber: string): Promise<FuelLogWithVehicle | null> {
  return apiFetch<FuelLogWithVehicle | null>(
    `/fuel-logs/last?vehicleNumber=${encodeURIComponent(vehicleNumber)}`,
  );
}

/** Inserts a log; distance, efficiency and meter advance computed server-side. */
export async function createFuelLog(input: CreateFuelLogInput): Promise<void> {
  await apiFetch('/fuel-logs', { method: 'POST', body: input });
}

/** All logs between two ISO dates (inclusive start, exclusive end). */
export async function getLogsByDateRange(startDate: string, endDate: string): Promise<FuelLog[]> {
  return apiFetch<FuelLog[]>(`/fuel-logs?from=${startDate}&to=${endDate}`);
}
