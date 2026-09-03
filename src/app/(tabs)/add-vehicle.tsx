import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { AppButton, TextField } from '@/src/components/ui';
import { useCreateVehicle } from '@/src/features/vehicles/queries';
import { normalizeVehicleNumber } from '@/src/lib/vehicle-number';
import { getErrorMessage } from '@/src/lib/errors';
import { Routes } from '@/src/navigation/routes';
import { colors, spacing } from '@/src/theme/tokens';

/**
 * Vehicle registration form. One field = one state entry, validated with a
 * zod schema on submit (the old version kept two parallel states for the
 * vehicle number and clipped its own content with `scrollView: {height: 200}`).
 */

const MAX_FIELD = 120;
const MAX_TEXT = 60;

const vehicleFormSchema = z.object({
  vehicle_number: z
    .string()
    .refine((v) => normalizeVehicleNumber(v) !== null, {
      message: 'Enter a valid 10-character vehicle number, e.g. KA05MJ6100',
    }),
  vehicle_name: z.string().min(1, 'Vehicle name is required').max(MAX_TEXT),
  vehicle_type: z.string().min(1, 'Vehicle type is required').max(MAX_TEXT),
  vehicle_class: z.string().min(1, 'Vehicle class is required').max(MAX_TEXT),
  owner_name: z.string().max(MAX_TEXT),
  place: z.string().min(1, 'Place is required').max(MAX_TEXT),
  organization: z.string().max(MAX_TEXT),
  department: z.string().max(MAX_TEXT),
  current_meter_reading: z
    .string()
    .refine((v) => Number(v) > 0, { message: 'Enter a valid meter reading' }),
  permitted_liters: z
    .string()
    .refine((v) => Number(v) > 0, { message: 'Enter a valid permitted liters value' }),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

const EMPTY_FORM: VehicleFormValues = {
  vehicle_number: '',
  vehicle_name: '',
  vehicle_type: '',
  vehicle_class: '',
  owner_name: '',
  place: '',
  organization: '',
  department: '',
  current_meter_reading: '',
  permitted_liters: '',
};

type FieldName = keyof VehicleFormValues;

const TEXT_FIELDS: Array<{ name: FieldName; label: string }> = [
  { name: 'vehicle_name', label: 'Vehicle Name' },
  { name: 'vehicle_type', label: 'Vehicle Type' },
  { name: 'vehicle_class', label: 'Vehicle Class' },
  { name: 'owner_name', label: 'Owner Name' },
  { name: 'place', label: 'Place' },
  { name: 'organization', label: 'Organization' },
  { name: 'department', label: 'Department' },
];

export default function AddVehicleScreen() {
  const router = useRouter();
  const createVehicle = useCreateVehicle();

  const [form, setForm] = useState<VehicleFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});

  const setField = (name: FieldName, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const normalizeNumberOnBlur = () => {
    const normalized = normalizeVehicleNumber(form.vehicle_number);
    if (normalized) {
      setField('vehicle_number', normalized);
    }
  };

  const handleSubmit = () => {
    const parsed = vehicleFormSchema.safeParse(form);
    if (!parsed.success) {
      const errors: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName | undefined;
        if (key && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    const v = parsed.data;
    createVehicle.mutate(
      {
        vehicle_number: normalizeVehicleNumber(v.vehicle_number) as string,
        vehicle_name: v.vehicle_name,
        vehicle_type: v.vehicle_type,
        vehicle_class: v.vehicle_class,
        owner_name: v.owner_name,
        place: v.place,
        organization: v.organization,
        department: v.department,
        current_meter_reading: Number(v.current_meter_reading),
        permitted_liters: Number(v.permitted_liters),
      },
      {
        onSuccess: () => {
          const number = normalizeVehicleNumber(v.vehicle_number) as string;
          router.replace(Routes.qrShow(number));
        },
        onError: () => {
          setFieldErrors({ vehicle_number: getErrorMessage(createVehicle.error) });
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'height' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Add Vehicle</Text>

        <TextField
          label="Vehicle Number"
          value={form.vehicle_number}
          onChangeText={(v) => setField('vehicle_number', v)}
          onBlur={normalizeNumberOnBlur}
          autoCapitalize="characters"
          error={fieldErrors.vehicle_number}
        />
        {TEXT_FIELDS.map(({ name, label }) => (
          <TextField
            key={name}
            label={label}
            value={form[name]}
            onChangeText={(v) => setField(name, v)}
            maxLength={name === 'owner_name' ? MAX_FIELD : MAX_TEXT}
            error={fieldErrors[name]}
          />
        ))}
        <TextField
          label="Current Meter Reading"
          value={form.current_meter_reading}
          onChangeText={(v) => setField('current_meter_reading', v)}
          keyboardType="numeric"
          error={fieldErrors.current_meter_reading}
        />
        <TextField
          label="Default Permitted Liters"
          value={form.permitted_liters}
          onChangeText={(v) => setField('permitted_liters', v)}
          keyboardType="numeric"
          error={fieldErrors.permitted_liters}
        />

        <View style={styles.buttonWrapper}>
          <AppButton
            label="Save Vehicle"
            onPress={handleSubmit}
            loading={createVehicle.isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  buttonWrapper: {
    marginTop: spacing.sm,
  },
});

