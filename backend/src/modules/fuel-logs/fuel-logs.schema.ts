import { z } from 'zod';

export const recentLogsQuerySchema = z.object({
  place: z.string().trim().min(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const lastLogQuerySchema = z.object({
  vehicleNumber: z.string().trim().min(1),
});

export const dateRangeQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD'),
});

export const createFuelLogSchema = z.object({
  vehicle_number: z.string().trim().min(1),
  meter_reading: z.coerce.number().positive(),
  filled_liters: z.coerce.number().positive(),
  place: z.string().trim().min(1),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'transaction_date must be YYYY-MM-DD'),
  transaction_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'transaction_time must be HH:MM[:SS]'),
});

export type RecentLogsQuery = z.infer<typeof recentLogsQuerySchema>;
export type LastLogQuery = z.infer<typeof lastLogQuerySchema>;
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
