import { z } from 'zod';

export const refreshMonthlyReportSchema = z.object({
  firstDatePrev: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'firstDatePrev must be YYYY-MM-DD'),
  lastDatePrev: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'lastDatePrev must be YYYY-MM-DD'),
  period: z.string().trim().min(1),
});

export const monthNameParamSchema = z.object({
  monthName: z.string().trim().min(1),
});

export type RefreshMonthlyReportInput = z.infer<typeof refreshMonthlyReportSchema>;
