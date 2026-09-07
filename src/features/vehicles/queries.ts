import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createVehicle,
  getAllVehicles,
  getVehicleByNumber,
  updateVehicleByNumber,
  type CreateVehicleInput,
  type UpdateVehicleInput,
} from '@/src/features/vehicles/api';

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: () => [...vehicleKeys.all, 'list'] as const,
  detail: (vehicleNumber: string) => [...vehicleKeys.all, 'detail', vehicleNumber] as const,
};

/** All vehicles (All Vehicles screen). */
export function useVehiclesList() {
  return useQuery({
    queryKey: vehicleKeys.list(),
    queryFn: getAllVehicles,
  });
}

/** Single vehicle lookup (fill-fuel, edit-vehicle). Disabled until a number exists. */
export function useVehicle(vehicleNumber: string | undefined) {
  return useQuery({
    queryKey: vehicleKeys.detail(vehicleNumber ?? ''),
    queryFn: () => getVehicleByNumber(vehicleNumber as string),
    enabled: Boolean(vehicleNumber),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVehicleInput) => createVehicle(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}

export function useUpdateVehicle(vehicleNumber: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: UpdateVehicleInput) => updateVehicleByNumber(vehicleNumber, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}
