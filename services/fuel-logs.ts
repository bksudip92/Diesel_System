import { supabase } from '@/lib/supabase';
import { FuelLog, FuelLogFlat, FuelLogWithVehicle } from '@/types/database';

export interface CreateFuelLogInput {
  vehicle_id_fk: number;
  meter_reading: number;
  previous_meter_reading: number;
  calculated_distance: number;
  filled_liters: number;
  calculated_efficiency: number;
  place: string;
  transaction_date: string;
  transaction_time: string;
  transaction_timestamp: string;
}

/**
 * Fetch recent fuel logs for a given place (for Dashboard).
 */
export async function getRecentLogs(
  place: string,
  limit = 10,
): Promise<{ data: FuelLogFlat[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select(
        `id,
         filled_liters,
         calculated_efficiency,
         calculated_distance,
         transaction_timestamp,
         place,
         vehicles(vehicle_number)`,
      )
      .eq('place', place)
      .order('transaction_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const flattened: FuelLogFlat[] = (data ?? []).map((row) => ({
      id: row.id,
      filled_liters: row.filled_liters,
      calculated_efficiency: row.calculated_efficiency,
      transaction_timestamp: row.transaction_timestamp,
      place: row.place,
      vehicles: Array.isArray(row.vehicles)
        ? ((row.vehicles[0] as { vehicle_number?: string })?.vehicle_number ?? 'Unknown Vehicle')
        : ((row.vehicles as { vehicle_number?: string })?.vehicle_number ?? 'Unknown Vehicle'),
    }));

    return { data: flattened, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Fetch the last fuel log for a vehicle by vehicle_number (uses the view).
 */
export async function getLastFuelLog(
  vehicleNumber: string,
): Promise<{ data: FuelLogWithVehicle | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('fuel_logs_with_vehicle')
      .select('*')
      .eq('vehicle_number', vehicleNumber)
      .order('meter_reading', { ascending: false })
      .limit(1);

    if (error) throw error;
    const item = Array.isArray(data) && data.length > 0 ? (data[0] as FuelLogWithVehicle) : null;
    return { data: item, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Insert a new fuel log record.
 */
export async function createFuelLog(
  input: CreateFuelLogInput,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('fuel_logs').insert(input);
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error };
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
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .gte('transaction_date', startDate)
      .lt('transaction_date', endDate);

    if (error) throw error;
    return { data: data as FuelLog[], error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}
