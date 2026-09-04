import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/src/theme/tokens';

interface EmptyStateProps {
  message: string;
  /** Optional hint shown under the main message. */
  hint?: string;
}

/** Friendly placeholder when a list has no items. */
export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
