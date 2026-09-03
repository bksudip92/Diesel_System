import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { MonthlyReport } from '@/src/types/models';
import { useMonthlyReports, useRefreshMonthlyReport } from '@/src/features/reports/queries';
import { getMonthDateRange, MONTH_NAMES } from '@/src/features/reports/utils';
import { EmptyState, ErrorState, LoadingView } from '@/src/components/ui';
import { Routes } from '@/src/navigation/routes';
import { formatDate } from '@/src/lib/format';
import { colors, radius, shadow, spacing } from '@/src/theme/tokens';

interface MonthReportRowProps {
  report: MonthlyReport;
  onPress: () => void;
}

/** List row — kept outside the renderer so rows are never remounted. */
function MonthReportRow({ report, onPress }: MonthReportRowProps) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <View style={styles.rowHeader}>
        <Text style={styles.monthName}>{report.month_name}</Text>
        <Text style={styles.diesel}>{report.total_diesel} L</Text>
      </View>
      <View style={styles.rowFooter}>
        <Text style={styles.meta}>
          {formatDate(report.first_date)} – {formatDate(report.last_date)}
        </Text>
        <Text style={styles.fills}>{report.total_fills} fills</Text>
      </View>
    </Pressable>
  );
}

export default function MonthlyReportsList() {
  const router = useRouter();
  const reportsQuery = useMonthlyReports();
  const refreshReport = useRefreshMonthlyReport();

  const currentRange = getMonthDateRange(MONTH_NAMES[new Date().getMonth()]);

  const handleRefreshAggregates = () => {
    refreshReport.mutate({
      firstDatePrev: currentRange.firstDatePrev,
      lastDatePrev: currentRange.lastDatePrev,
      period: currentRange.period,
    });
  };

  if (reportsQuery.isPending) {
    return <LoadingView />;
  }

  if (reportsQuery.isError) {
    return <ErrorState message="Unable to load monthly reports." onRetry={() => reportsQuery.refetch()} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Reports</Text>
        <Pressable
          onPress={handleRefreshAggregates}
          disabled={refreshReport.isPending}
          style={({ pressed }) => [styles.refreshButton, pressed && styles.refreshPressed]}
        >
          <Text style={styles.refreshText}>
            {refreshReport.isPending ? 'Refreshing…' : 'Refresh'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={reportsQuery.data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <MonthReportRow
            report={item}
            onPress={() => router.navigate(Routes.monthlyReportDetail(item.month_name))}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="No monthly reports yet." hint="Fill fuel to generate reports." />}
        refreshControl={
          <RefreshControl
            refreshing={reportsQuery.isRefetching}
            onRefresh={() => reportsQuery.refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  refreshPressed: {
    opacity: 0.8,
  },
  refreshText: {
    color: colors.textInverse,
    fontWeight: '600',
    fontSize: 13,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
    ...shadow,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  monthName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  diesel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  fills: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
