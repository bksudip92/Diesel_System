import { apiFetch } from '@/src/lib/api-client';
import type { MonthlyReport } from '@/src/types/models';

/**
 * Reports feature API.
 */

export async function getMonthlyReports(): Promise<MonthlyReport[]> {
  return apiFetch<MonthlyReport[]>('/reports/monthly');
}

export async function getMonthlyReportByName(monthName: string): Promise<MonthlyReport> {
  return apiFetch<MonthlyReport>(`/reports/monthly/${encodeURIComponent(monthName)}`);
}

export interface RefreshMonthlyReportInput {
  firstDatePrev: string;
  lastDatePrev: string;
  period: string;
}

/** Aggregates fuel_logs for a range and upserts into monthly_reports. */
export async function refreshMonthlyReport(input: RefreshMonthlyReportInput): Promise<void> {
  await apiFetch('/reports/monthly/refresh', {
    method: 'POST',
    body: input,
  });
}
