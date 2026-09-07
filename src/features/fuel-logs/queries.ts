import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFuelLog,
  getLastFuelLog,
  getLogsByDateRange,
  getRecentLogs,
  type CreateFuelLogInput,
} from '@/src/features/fuel-logs/api';

export const fuelLogKeys = {
  all: ['fuel-logs'] as const,
  recent: (place: string, limit: number) => [...fuelLogKeys.all, 'recent', place, limit] as const,
  last: (vehicleNumber: string) => [...fuelLogKeys.all, 'last', vehicleNumber] as const,
  range: (start: string, end: string) => [...fuelLogKeys.all, 'range', start, end] as const,
};

/** Dashboard list. Disabled until the profile provides a place. */
export function useRecentLogs(place: string | undefined, limit = 10) {
  return useQuery({
    queryKey: fuelLogKeys.recent(place ?? '', limit),
    queryFn: () => getRecentLogs(place as string, limit),
    enabled: Boolean(place),
  });
}

/** Previous log for a vehicle on the fill-fuel screen. */
export function useLastFuelLog(vehicleNumber: string | undefined) {
  return useQuery({
    queryKey: fuelLogKeys.last(vehicleNumber ?? ''),
    queryFn: () => getLastFuelLog(vehicleNumber as string),
    enabled: Boolean(vehicleNumber),
  });
}

export function useLogsByDateRange(startDate: string | undefined, endDate: string | undefined) {
  return useQuery({
    queryKey: fuelLogKeys.range(startDate ?? '', endDate ?? ''),
    queryFn: () => getLogsByDateRange(startDate as string, endDate as string),
    enabled: Boolean(startDate && endDate),
  });
}

/**
 * Submit a fuel log. Invalidates dashboard + vehicle queries so every
 * open list reflects the new entry (previously screens refetched manually
 * via useFocusEffect hacks).
 */
export function useCreateFuelLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFuelLogInput) => createFuelLog(input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: fuelLogKeys.all });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      void input;
    },
  });
}
