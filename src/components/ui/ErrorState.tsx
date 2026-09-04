import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/src/components/ui/AppButton';
import { colors, spacing } from '@/src/theme/tokens';

interface ErrorStateProps {
  message?: string;
  /** When provided, shows a Retry button. */
  onRetry?: () => void;
}

/** Centered error message with optional retry action. */
export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={styles.button}>
          <AppButton label="Retry" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  message: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    minWidth: 140,
  },
});
