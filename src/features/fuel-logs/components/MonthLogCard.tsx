import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FuelLog } from '@/src/types/models';
import { formatDate } from '@/src/lib/format';
import { colors, radius, spacing, shadow } from '@/src/theme/tokens';

interface MonthLogCardProps {
  log: FuelLog;
}

function efficiencyColor(eff: number | null): string {
  if (eff === null) return colors.textMuted;
  if (eff >= 15) return colors.success;
  if (eff < 5) return colors.error;
  return colors.warning;
}

/** Monthly-report detail list item. */
export function MonthLogCard({ log }: MonthLogCardProps) {
  const effColor = efficiencyColor(log.calculated_efficiency);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.dateText}>{formatDate(log.transaction_date)}</Text>
          <Text style={styles.timeText}>{log.transaction_time}</Text>
        </View>
        <View style={styles.placeBadge}>
          <Ionicons name="location-sharp" size={12} color={colors.textSecondary} />
          <Text style={styles.placeText}>{log.place}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Fuel</Text>
          <Text style={styles.statValue}>
            {log.filled_liters} <Text style={styles.unit}>L</Text>
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>
            {log.calculated_distance} <Text style={styles.unit}>km</Text>
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Efficiency</Text>
          <Text style={[styles.statValue, { color: effColor }]}>
            {log.calculated_efficiency !== null ? `${log.calculated_efficiency.toFixed(1)} ` : '— '}
            <Text style={[styles.unit, { color: effColor }]}>km/L</Text>
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Ionicons name="speedometer-outline" size={14} color={colors.textMuted} />
        <Text style={styles.odometerText}> Odometer: {log.meter_reading}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
    ...shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm + 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  placeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  placeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm + 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 4,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    marginHorizontal: -spacing.md,
    marginBottom: -spacing.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  odometerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    fontFamily: 'Courier',
  },
});
