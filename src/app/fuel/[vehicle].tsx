import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/src/providers';
import { useCreateFuelLog, useLastFuelLog } from '@/src/features/fuel-logs/queries';
import { useVehicle } from '@/src/features/vehicles/queries';
import {
  calculateDistance,
  calculateEfficiency,
  validateFuelLogInput,
} from '@/src/features/fuel-logs/utils';
import { nowHMMSTime, todayISODate } from '@/src/lib/format';
import { getErrorMessage } from '@/src/lib/errors';
import { AppButton, LoadingView } from '@/src/components/ui';
import { colors, radius, spacing } from '@/src/theme/tokens';

/**
 * Fill-fuel form for a scanned vehicle.
 *
 * BUG FIX vs the old screen: the driver's place is now read from the auth
 * provider. The old version read AsyncStorage key '@user_profile' while the
 * session was saved under 'user_profile', so the API silently received an
 * empty `place` and logs never showed on the Dashboard.
 */

const FUEL_API_TOLERANCE = 0;

export default function FillFuelScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const params = useLocalSearchParams<{ vehicle?: string | string[] }>();
  const vehicleNumber = Array.isArray(params.vehicle) ? params.vehicle[0] : params.vehicle;

  const vehicleQuery = useVehicle(vehicleNumber);
  const lastLogQuery = useLastFuelLog(vehicleNumber);
  const createLog = useCreateFuelLog();

  const [meterReading, setMeterReading] = useState('');
  const [filledLiters, setFilledLiters] = useState('');

  const vehicle = vehicleQuery.data;
  const lastLog = lastLogQuery.data;
  const previousReading = lastLog?.meter_reading ?? 0;

  // The signed-in operator's place (the fix described above).
  const place = profile?.place ?? '';

  const parsedMeter = Number.parseFloat(meterReading);
  const parsedLiters = Number.parseFloat(filledLiters);

  const distance = Number.isFinite(parsedMeter)
    ? calculateDistance(parsedMeter, previousReading)
    : 0;
  const efficiency = calculateEfficiency(distance, Number.isFinite(parsedLiters) ? parsedLiters : 0);

  const remainingAllotment =
    vehicle && Number.isFinite(parsedLiters) && parsedLiters > 0
      ? vehicle.permitted_liters - parsedLiters
      : vehicle?.permitted_liters ?? null;

  const handleSubmit = () => {
    if (!vehicleNumber) return;

    const validation = validateFuelLogInput(meterReading, filledLiters, previousReading);
    if (!validation.ok) {
      Alert.alert('Invalid Input', validation.message);
      return;
    }
    if (!place) {
      Alert.alert('Missing Place', 'Your profile has no place assigned. Contact an administrator.');
      return;
    }

    createLog.mutate(
      {
        vehicle_number: vehicleNumber,
        meter_reading: validation.meterReading + FUEL_API_TOLERANCE,
        filled_liters: validation.filledLiters,
        place,
        transaction_date: todayISODate(),
        transaction_time: nowHMMSTime(),
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Fuel Log Saved',
            `${validation.filledLiters} L filled for ${vehicleNumber}. ` +
              `Distance: ${distance} km` +
              (efficiency > 0 ? ` • Efficiency: ${efficiency} km/L` : ''),
          );
          setMeterReading('');
          setFilledLiters('');
          router.back();
        },
        onError: () => {
          Alert.alert('Error', getErrorMessage(createLog.error));
        },
      },
    );
  };

  if (vehicleQuery.isPending || lastLogQuery.isPending) {
    return <LoadingView />;
  }

  if (vehicleQuery.isError || !vehicle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {vehicleQuery.isError ? getErrorMessage(vehicleQuery.error) : 'Vehicle not found.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleNumber}>{vehicle.vehicle_number}</Text>
          <Text style={styles.vehicleName}>{vehicle.vehicle_name}</Text>
          <Text style={styles.vehicleMeta}>
            {vehicle.vehicle_type} • {vehicle.vehicle_class}
          </Text>
          <Text style={styles.vehicleMeta}>
            Owner: {vehicle.owner_name || 'N/A'} • Limit: {vehicle.permitted_liters} L
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Previous Meter Reading</Text>
          <Text style={styles.infoValue}>{previousReading} km</Text>
        </View>

        <Text style={styles.label}>Meter Reading</Text>
        <TextInputNumeric
          value={meterReading}
          onChangeText={setMeterReading}
          placeholder={`New reading (must be > ${previousReading})`}
        />

        <Text style={styles.label}>Filled Liters</Text>
        <TextInputNumeric
          value={filledLiters}
          onChangeText={setFilledLiters}
          placeholder="e.g. 40"
        />

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Fill Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Calculated Distance</Text>
            <Text style={styles.summaryValue}>{distance} km</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Calculated Efficiency</Text>
            <Text style={styles.summaryValue}>
              {distance > 0 && Number.isFinite(parsedLiters) && parsedLiters > 0
                ? `${efficiency} km/L`
                : '—'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining Allotment</Text>
            <Text
              style={[
                styles.summaryValue,
                remainingAllotment !== null && remainingAllotment < 0
                  ? { color: colors.error }
                  : null,
              ]}
            >
              {remainingAllotment !== null ? `${remainingAllotment} L` : '—'}
            </Text>
          </View>

          <Text style={styles.allotmentNote}>
            This is a comparison to the vehicle's default monthly limit — it does not
            decrease your remaining monthly quantity.
          </Text>
        </View>

        <AppButton
          label="Submit Fuel Log"
          onPress={handleSubmit}
          loading={createLog.isPending}
        />
      </View>
    </ScrollView>
  );
}

/** Local numeric input so both fields share identical styling. */
function TextInputNumeric({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      keyboardType="numbers-and-punctuation"
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  vehicleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  vehicleNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  vehicleName: {
    fontSize: 16,
    color: colors.info,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  vehicleMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoBox: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.accentText,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accentText,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryBox: {
    backgroundColor: colors.warningSurface,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.warningTextStrong,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.warningText,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warningTextStrong,
  },
  allotmentNote: {
    fontSize: 12,
    color: colors.warningText,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    textAlign: 'center',
  },
});
