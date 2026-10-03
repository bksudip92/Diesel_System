import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { colors, radius, spacing } from '@/src/theme/tokens';

interface OptionFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  quickOptions: string[];
  error?: string | null;
}

/** Labeled radio group for common choices + dropdown for the full list. */
export function OptionField({ label, value, onChange, options, quickOptions, error }: OptionFieldProps) {
  const dropdownData = options.map((o) => ({ label: o, value: o }));
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.radioRow}>
        {quickOptions.map((opt) => {
          const selected = value === opt;
          return (
            <TouchableOpacity key={opt} style={styles.radioOption} onPress={() => onChange(opt)}>
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.radioLabel}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Dropdown
        style={[styles.dropdown, error ? styles.dropdownError : null]}
        placeholderStyle={styles.placeholder}
        selectedTextStyle={styles.selectedText}
        placeholder={label}
        data={dropdownData}
        labelField="label"
        valueField="value"
        value={value || null}
        onChange={(item) => onChange(item.value)}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: spacing.md,
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  dropdownError: {
    borderColor: colors.error,
  },
  placeholder: {
    fontSize: 15,
    color: colors.textMuted,
  },
  selectedText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});
