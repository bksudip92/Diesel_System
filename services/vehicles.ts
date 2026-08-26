import { apiFetch } from '@/lib/api';
import { Vehicle } from '@/types/database';

/**
 * Fetch all vehicles from the backend.
 */
export async function getAllVehicles(): Promise<{ data: Vehicle[] | null; error: Error | null }> {
  try {
    const data = await apiFetch<Vehicle[]>('/vehicles');
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

/**
 * Fetch a single vehicle by its vehicle_number.
 */
export async function getVehicleByNumber(
  vehicleNumber: string,
): Promise<{ data: Vehicle | null; error: Error | null }> {
  try {
    const data = await apiFetch<Vehicle>(`/vehicles/${encodeURIComponent(vehicleNumber)}`);
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
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

function toNumeric(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** Serializes the legacy form input into the API payload. */
export function toCreateVehiclePayload(
  input: CreateVehicleInput,
): Record<string, unknown> {
  return {
    ...input,
    owner_name: input.owner_name || null,
    department: input.department || null,
    organization: input.organization || null,
    place: input.place || null,
    current_meter_reading: toNumeric(input.current_meter_reading),
    permitted_liters: toNumeric(input.permitted_liters),
  };
}

/**
 * Insert a new vehicle record.
 */
export async function createVehicle(
  input: CreateVehicleInput,
): Promise<{ error: Error | null }> {
  try {
    await apiFetch('/vehicles', {
      method: 'POST',
      body: toCreateVehiclePayload(input),
    });
    return { error: null };
  } catch (e) {
    return { error: e as Error };
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
    await apiFetch(`/vehicles/${encodeURIComponent(vehicleNumber)}`, {
      method: 'PATCH',
      body: updates,
    });
    return { error: null };
  } catch (e) {
    return { error: e as Error };
  }
}
