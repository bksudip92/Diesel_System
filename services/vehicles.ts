import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types/database';

/**
 * Fetch all vehicles from the `vehicles` table.
 */
export async function getAllVehicles(): Promise<{ data: Vehicle[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) throw error;
    return { data: data as Vehicle[], error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Fetch a single vehicle by its vehicle_number (uses the vehicle_info view).
 */
export async function getVehicleByNumber(
  vehicleNumber: string,
): Promise<{ data: Vehicle | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('vehicle_info')
      .select('*')
      .eq('vehicle_number', vehicleNumber);

    if (error) throw error;
    const item = Array.isArray(data) && data.length > 0 ? (data[0] as Vehicle) : null;
    return { data: item, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export interface CreateVehicleInput {
  vehicle_number: string;
  vehicle_name: string;
  vehicle_type: string;
  vehicle_class: string;
  owner_name: string;
  place: string;
  organization: string;
  department: string;
  current_meter_reading: string;
  permitted_liters: string;
}

/**
 * Insert a new vehicle record.
 */
export async function createVehicle(
  input: CreateVehicleInput,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('vehicles').insert(input);
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

/**
 * Update existing vehicle details.
 */
export async function updateVehicleByNumber(
  vehicleNumber: string,
  updates: Partial<Vehicle>,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('vehicle_number', vehicleNumber);
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}
