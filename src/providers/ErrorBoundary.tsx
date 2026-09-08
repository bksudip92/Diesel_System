import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, spacing } from '@/src/theme/tokens';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Global crash guard. Previously an uncaught render error anywhere showed
 * React Native's red screen in production builds; now users get a friendly
 * restart message instead.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Hook a crash-reporting service (Sentry/Crashlytics) in here.
    // Always log: in release builds this is visible via `adb logcat`.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app ran into an unexpected error. Please restart the application.
          </Text>
          {this.state.message ? (
            <Text style={styles.detail} selectable>
              {this.state.message}
            </Text>
          ) : null}
          <Pressable
            onPress={this.handleRetry}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  detail: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center' as const,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center' as const,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
};
