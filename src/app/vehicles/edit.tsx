import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useVehicle, useUpdateVehicle } from '@/src/features/vehicles/queries';
import { LoadingView } from '@/src/components/ui';
import { getErrorMessage } from '@/src/lib/errors';
import { colors, radius, spacing } from '@/src/theme/tokens';

interface EditableField {
  key: 'current_meter_reading' | 'owner_name' | 'department' | 'permitted_liters';
  label: string;
  numeric?: boolean;
  placeholder: string;
}

const FIELDS: EditableField[] = [
  { key: 'current_meter_reading', label: 'Current Meter Reading (km)', numeric: true, placeholder: 'e.g. 12000' },
  { key: 'owner_name', label: 'Owner Name', placeholder: 'Enter owner name' },
  { key: 'department', label: 'Department / Organization', placeholder: 'e.g. Construction' },
  { key: 'permitted_liters', label: 'Fuel Limit (Liters)', numeric: true, placeholder: 'e.g. 200' },
];

export default function VehicleEditScreen() {
  const params = useLocalSearchParams<{ vehicle?: string | string[] }>();
  const vehicleNumber = Array.isArray(params.vehicle) ? params.vehicle[0] : params.vehicle;

  const vehicleQuery = useVehicle(vehicleNumber);
  const updateVehicle = useUpdateVehicle(vehicleNumber ?? '');

  const [drafts, setDrafts] = useState<Partial<Record<EditableField['key'], string>>>({});
  const [touched, setTouched] = useState(false);

  const vehicle = vehicleQuery.data;

  const setDraft = (key: EditableField['key'], value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
    setTouched(true);
  };

  const hasChanges = Object.values(drafts).some((v) => v !== undefined);

  const numericFieldsAreValid = useMemo(() => {
    return FIELDS.filter((f) => f.numeric).every((f) => {
      const raw = drafts[f.key];
      return raw === undefined || raw === '' || Number(raw) > 0;
    });
  }, [drafts]);

  const handleSave = () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'Enter at least one field to update.');
      return;
    }
    if (!numericFieldsAreValid) {
      Alert.alert('Invalid Input', 'Numeric fields must be greater than 0.');
      return;
    }

    const updates: Record<string, number | string> = {};
    if (drafts.current_meter_reading !== undefined && drafts.current_meter_reading !== '') {
      updates.current_meter_reading = Number(drafts.current_meter_reading);
    }
    if (drafts.owner_name !== undefined) updates.owner_name = drafts.owner_name;
    if (drafts.department !== undefined) updates.department = drafts.department;
    if (drafts.permitted_liters !== undefined && drafts.permitted_liters !== '') {
      updates.permitted_liters = Number(drafts.permitted_liters);
    }

    updateVehicle.mutate(updates, {
      onSuccess: () => {
        Alert.alert('Success', 'Vehicle information updated successfully!');
        setDrafts({});
        setTouched(false);
      },
      onError: () => {
        Alert.alert('Error', getErrorMessage(updateVehicle.error));
      },
    });
  };

  if (vehicleQuery.isPending) {
    return <LoadingView />;
  }

  if (vehicleQuery.isError || !vehicle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Unable to load vehicle details.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{vehicleNumber ?? 'Vehicle Details'}</Text>
      </View>

      <View style={styles.formSection}>
        {FIELDS.map((field) => (
          <React.Fragment key={field.key}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={drafts[field.key] ?? String(vehicle[field.key] ?? '')}
              onChangeText={(v) => setDraft(field.key, v)}
              keyboardType={field.numeric ? 'numeric' : 'default'}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textMuted}
            />
          </React.Fragment>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, (!touched || !hasChanges) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={updateVehicle.isPending}
      >
        <Text style={styles.saveButtonText}>
          {updateVehicle.isPending ? 'Saving…' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm + 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  formSection: { paddingHorizontal: spacing.lg },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm + 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.info,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.textInverse, fontSize: 18, fontWeight: 'bold' },
  errorText: { fontSize: 16, color: colors.error },
});
