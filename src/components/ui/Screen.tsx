import React from 'react';
import { ScrollView, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/src/theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (keyboard-dismissing). */
  scroll?: boolean;
  /** Apply horizontal padding. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Safe-area screen wrapper — replaces ad-hoc `paddingTop: 50` hacks. */
export function Screen({ children, scroll = false, padded = false, style }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={padded ? styles.padded : undefined}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padded && styles.padded]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.md,
  },
});
