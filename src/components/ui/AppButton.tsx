import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/src/theme/tokens';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  /** Shows a spinner and disables interaction. */
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
}

/** Primary action button with pressed/disabled/loading states. */
export function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.outline,
        variant === 'primary' && pressed && !isDisabled && styles.primaryPressed,
        variant === 'primary' && isDisabled && styles.primaryDisabled,
        variant === 'outline' && pressed && !isDisabled && styles.outlinePressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.primary} />
      ) : (
        <Text style={[styles.label, variant === 'outline' && styles.outlineLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryDisabled: {
    backgroundColor: colors.primaryDisabled,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlinePressed: {
    backgroundColor: colors.accentLight,
  },
  label: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineLabel: {
    color: colors.primary,
  },
});
