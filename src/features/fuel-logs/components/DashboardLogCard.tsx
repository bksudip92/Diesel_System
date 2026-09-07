import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FuelLogFlat } from '@/src/types/models';
import { formatDateTime } from '@/src/lib/format';
import { colors, radius, spacing, shadow } from '@/src/theme/tokens';

interface DashboardLogCardProps {
  log: FuelLogFlat;
}

/** Dashboard list item — vehicle header, efficiency/filled stats, timestamp. */
export function DashboardLogCard({ log }: DashboardLogCardProps) {
  const vehicleNumber = typeof log.vehicles === 'string' ? log.vehicles : 'Unknown Vehicle';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.vehicleText}>{vehicleNumber}</Text>
        <Text style={styles.idText}>#{log.id}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Efficiency</Text>
          <Text style={styles.statValue}>
            {log.calculated_efficiency != null ? `${log.calculated_efficiency} km/L` : '—'}
          </Text>
        </View>
        <View style={styles.verticalLine} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Filled</Text>
          <Text style={styles.statValue}>{log.filled_liters} L</Text>
        </View>
      </View>

      <Text style={styles.dateText}>{formatDateTime(log.transaction_timestamp)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm + 4,
    ...shadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vehicleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  idText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm + 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  verticalLine: {
    width: 1,
    backgroundColor: colors.border,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
});
