import { supabase } from '@/lib/supabase';
import { MonthlyReport } from '@/types/database';

/**
 * Fetch all monthly report entries.
 */
export async function getMonthlyReports(): Promise<{
  data: MonthlyReport[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.from('monthly_reports').select('*');
    if (error) throw error;
    return { data: data as MonthlyReport[], error: null };
  } catch (error: any) {
    return { data: null, error };
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
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('month_name', monthName)
      .limit(1);

    if (error) throw error;
    const item = Array.isArray(data) && data.length > 0 ? (data[0] as MonthlyReport) : null;
    return { data: item, error: null };
  } catch (error: any) {
    return { data: null, error };
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
    const { data, error: fetchError } = await supabase
      .from('fuel_logs')
      .select('filled_liters.sum(), filled_liters.count()')
      .gte('transaction_date', input.firstDatePrev)
      .lt('transaction_date', input.lastDatePrev);

    if (fetchError) throw fetchError;

    const totalDiesel = (data?.[0] as any)?.sum ?? 0;
    const totalFills = (data?.[0] as any)?.count ?? 0;

    const { error: upsertError } = await supabase.from('monthly_reports').upsert({
      month_name: input.period,
      total_diesel: totalDiesel,
      total_fills: totalFills,
      first_date: input.firstDatePrev,
      last_date: input.lastDatePrev,
    });

    if (upsertError) throw upsertError;
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}
