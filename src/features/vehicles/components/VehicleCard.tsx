import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Vehicle } from '@/src/types/models';
import { colors, radius, spacing, shadow } from '@/src/theme/tokens';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

/**
 * List item for the All Vehicles screen.
 * Lives OUTSIDE the list renderer (the old version was defined inline,
 * remounting on every render and dropping list frames).
 */
export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.label}>Vehicle No.</Text>
          <Text style={styles.vehicleNumber}>{vehicle.vehicle_number}</Text>
        </View>
        <View style={styles.alignEnd}>
          <Text style={styles.label}>Vehicle Name</Text>
          <Text style={styles.vehicleName}>{vehicle.vehicle_name}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          Reading: <Text style={styles.infoValue}>{vehicle.current_meter_reading} km</Text>
        </Text>
        <Text style={styles.infoText}>
          Limit: <Text style={styles.infoValue}>{vehicle.permitted_liters}L</Text>
        </Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItemLeft}>
          <Text style={styles.label}>Owner</Text>
          <Text style={styles.ownerName} numberOfLines={1}>
            {vehicle.owner_name || 'N/A'}
          </Text>
        </View>
        <View style={styles.footerItemRight}>
          <Text style={styles.label}>Org / Dept</Text>
          <Text style={styles.orgName} numberOfLines={1}>
            {vehicle.organization || vehicle.department || 'N/A'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 5,
    borderLeftColor: colors.info,
    ...shadow,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 2,
    fontWeight: '600',
  },
  vehicleNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.info,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm + 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    marginHorizontal: -spacing.md,
    marginBottom: -spacing.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  footerItemLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  footerItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
