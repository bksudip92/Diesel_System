import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/src/theme/tokens';

/** Thin horizontal divider for FlatLists. */
export function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
