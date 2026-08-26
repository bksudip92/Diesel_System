import { z } from 'zod';

export const listVehiclesQuerySchema = z.object({
  place: z.string().trim().min(1).optional(),
});

export const vehicleNumberParamSchema = z.object({
  number: z.string().trim().min(1),
});

export const createVehicleSchema = z.object({
  vehicle_number: z.string().trim().min(1),
  vehicle_name: z.string().trim().min(1),
  vehicle_type: z.string().trim().min(1),
  vehicle_class: z.string().trim().min(1),
  owner_name: z.string().trim().optional().nullable(),
  department: z.string().trim().optional().nullable(),
  organization: z.string().trim().optional().nullable(),
  place: z.string().trim().optional().nullable(),
  current_meter_reading: z.coerce.number().nonnegative(),
  permitted_liters: z.coerce.number().positive(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
