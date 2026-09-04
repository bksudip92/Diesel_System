import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { FuelLog } from '@/src/types/models';
import { useMonthlyReport } from '@/src/features/reports/queries';
import { isMonthName, getMonthDateRange } from '@/src/features/reports/utils';
import { useLogsByDateRange } from '@/src/features/fuel-logs/queries';
import { MonthLogCard } from '@/src/features/fuel-logs/components/MonthLogCard';
import { EmptyState, ErrorState, ListSeparator, LoadingView } from '@/src/components/ui';
import { colors, radius, shadow, spacing } from '@/src/theme/tokens';

export default function MonthReportDetail() {
  const params = useLocalSearchParams<{ name?: string | string[] }>();
  const monthParam = Array.isArray(params.name) ? params.name[0] : params.name;
  const monthName = monthParam && isMonthName(monthParam) ? monthParam : null;

  if (!monthName) {
    return <ErrorState message={`Unknown month: ${monthParam ?? ''}`} />;
  }

  return <MonthReportContent monthName={monthName} />;
}

function MonthReportContent({ monthName }: { monthName: string }) {
  const range = getMonthDateRange(monthName as Parameters<typeof getMonthDateRange>[0]);
  const reportQuery = useMonthlyReport(monthName);
  const logsQuery = useLogsByDateRange(range.firstDatePrev, range.endDateExclusive);

  const isPending = reportQuery.isPending || logsQuery.isPending;
  const isError = reportQuery.isError || logsQuery.isError;

  if (isPending) {
    return <LoadingView />;
  }

  if (isError) {
    return (
      <ErrorState
        message="Unable to load this month's report."
        onRetry={() => logsQuery.refetch()}
      />
    );
  }

  const report = reportQuery.data;
  const logs = logsQuery.data ?? [];

  const summary = (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryMonth}>{monthName}</Text>
      <View style={styles.summaryStats}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Diesel</Text>
          <Text style={styles.summaryValue}>{report?.total_diesel ?? '—'} L</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Fills</Text>
          <Text style={styles.summaryValue}>{report?.total_fills ?? '—'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(item: FuelLog) => String(item.id)}
        renderItem={({ item }) => <MonthLogCard log={item} />}
        ItemSeparatorComponent={ListSeparator}
        contentContainerStyle={styles.list}
        ListHeaderComponent={summary}
        ListEmptyComponent={
          <EmptyState message="No fuel logs this month." hint="Logs appear here after a fill-up." />
        }
        refreshControl={
          <RefreshControl
            refreshing={logsQuery.isRefetching}
            onRefresh={() => logsQuery.refetch()}
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
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow,
  },
  summaryMonth: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginBottom: spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.accentLight,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
});
