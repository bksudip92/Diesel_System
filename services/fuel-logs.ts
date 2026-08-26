import { apiFetch } from '@/lib/api';
import { FuelLog, FuelLogFlat, FuelLogWithVehicle } from '@/types/database';

export interface CreateFuelLogInput {
  vehicle_number: string;
  meter_reading: number;
  filled_liters: number;
  place: string;
  transaction_date: string;
  transaction_time: string;
}

/**
 * Fetch recent fuel logs for a given place (for Dashboard).
 */
export async function getRecentLogs(
  place: string,
  limit = 10,
): Promise<{ data: FuelLogFlat[] | null; error: Error | null }> {
  try {
    const data = await apiFetch<FuelLogFlat[]>(
      `/fuel-logs/recent?place=${encodeURIComponent(place)}&limit=${limit}`,
    );
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

/**
 * Fetch the last fuel log for a vehicle by vehicle_number.
 */
export async function getLastFuelLog(
  vehicleNumber: string,
): Promise<{ data: FuelLogWithVehicle | null; error: Error | null }> {
  try {
    const data = await apiFetch<FuelLogWithVehicle | null>(
      `/fuel-logs/last?vehicleNumber=${encodeURIComponent(vehicleNumber)}`,
    );
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

/**
 * Insert a new fuel log record. Distance, efficiency and the vehicle meter
 * advance are computed server-side.
 */
export async function createFuelLog(
  input: CreateFuelLogInput,
): Promise<{ error: Error | null }> {
  try {
    await apiFetch('/fuel-logs', { method: 'POST', body: input });
    return { error: null };
  } catch (e) {
    return { error: e as Error };
  }
}

/**
 * Fetch all fuel logs between two dates (inclusive start, exclusive end).
 */
export async function getLogsByDateRange(
  startDate: string,
  endDate: string,
): Promise<{ data: FuelLog[] | null; error: Error | null }> {
  try {
    const data = await apiFetch<FuelLog[]>(`/fuel-logs?from=${startDate}&to=${endDate}`);
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}
