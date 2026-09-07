import { apiFetch } from '@/src/lib/api-client';
import type { Vehicle } from '@/src/types/models';

/**
 * Vehicles feature API. Throws ApiRequestError on failure — error handling
 * is centralized in TanStack Query, not per-call tuples.
 */

export async function getAllVehicles(): Promise<Vehicle[]> {
  return apiFetch<Vehicle[]>('/vehicles');
}

export async function getVehicleByNumber(vehicleNumber: string): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/vehicles/${encodeURIComponent(vehicleNumber)}`);
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
  current_meter_reading: number;
  permitted_liters: number;
}

export async function createVehicle(input: CreateVehicleInput): Promise<void> {
  await apiFetch('/vehicles', {
    method: 'POST',
    body: {
      ...input,
      owner_name: input.owner_name || null,
      department: input.department || null,
      organization: input.organization || null,
      place: input.place || null,
    },
  });
}

export interface UpdateVehicleInput {
  current_meter_reading?: number;
  owner_name?: string;
  department?: string;
  permitted_liters?: number;
}

export async function updateVehicleByNumber(
  vehicleNumber: string,
  updates: UpdateVehicleInput,
): Promise<void> {
  await apiFetch(`/vehicles/${encodeURIComponent(vehicleNumber)}`, {
    method: 'PATCH',
    body: updates,
  });
}
