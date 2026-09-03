import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMonthlyReportByName,
  getMonthlyReports,
  refreshMonthlyReport,
  type RefreshMonthlyReportInput,
} from '@/src/features/reports/api';

export const reportKeys = {
  all: ['reports'] as const,
  monthly: () => [...reportKeys.all, 'monthly'] as const,
  monthlyList: () => [...reportKeys.monthly(), 'list'] as const,
  monthlyByName: (month: string) => [...reportKeys.monthly(), 'detail', month] as const,
};

export function useMonthlyReports() {
  return useQuery({
    queryKey: reportKeys.monthlyList(),
    queryFn: getMonthlyReports,
  });
}

export function useMonthlyReport(monthName: string | undefined) {
  return useQuery({
    queryKey: reportKeys.monthlyByName(monthName ?? ''),
    queryFn: () => getMonthlyReportByName(monthName as string),
    enabled: Boolean(monthName),
  });
}

export function useRefreshMonthlyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RefreshMonthlyReportInput) => refreshMonthlyReport(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.monthly() });
    },
  });
}
