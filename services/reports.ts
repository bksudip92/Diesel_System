import { apiFetch } from '@/lib/api';
import { MonthlyReport } from '@/types/database';

/**
 * Fetch all monthly report entries.
 */
export async function getMonthlyReports(): Promise<{
  data: MonthlyReport[] | null;
  error: Error | null;
}> {
  try {
    const data = await apiFetch<MonthlyReport[]>('/reports/monthly');
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

/**
 * Fetch a single monthly report by month_name.
 */
export async function getMonthlyReportByName(monthName: string): Promise<{
  data: MonthlyReport | null;
  error: Error | null;
}> {
  try {
    const data = await apiFetch<MonthlyReport>(
      `/reports/monthly/${encodeURIComponent(monthName)}`,
    );
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

export interface RefreshMonthlyReportInput {
  firstDatePrev: string;
  lastDatePrev: string;
  period: string;
}

/**
 * Aggregate fuel_logs for a date range and upsert into monthly_reports.
 */
export async function refreshMonthlyReport(
  input: RefreshMonthlyReportInput,
): Promise<{ error: Error | null }> {
  try {
    await apiFetch('/reports/monthly/refresh', {
      method: 'POST',
      body: input,
    });
    return { error: null };
  } catch (e) {
    return { error: e as Error };
  }
}

/**
 * Fetch all yearly report entries.
 */
export async function getYearlyReports(): Promise<{
  data: unknown[] | null;
  error: Error | null;
}> {
  try {
    const data = await apiFetch<unknown[]>('/reports/yearly');
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}
