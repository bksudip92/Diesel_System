import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Routes } from '@/src/navigation/routes';
import { colors, shadow, spacing, typography } from '@/src/theme/tokens';

interface SectionLinkProps {
  label: string;
  onPress: () => void;
}

function SectionLink({ label, onPress }: SectionLinkProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.section, pressed && styles.sectionPressed]}
      onPress={onPress}
    >
      <Text style={styles.sectionText}>{label}</Text>
    </Pressable>
  );
}

export default function ReportsMenu() {
  const router = useRouter();
  // The tabs navigator hides its own header; keep this screen's content clear
  // of the status bar with the same inset the other tabs use.
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.screenTitle}>Reports</Text>
      <SectionLink label="All Vehicles" onPress={() => router.navigate(Routes.vehicleList)} />
      <SectionLink label="Monthly Report" onPress={() => router.navigate(Routes.monthlyReports)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  section: {
    width: '100%',
    height: 60,
    borderRadius: 3,
    margin: 1,
    padding: 2,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadow,
  },
  sectionPressed: {
    opacity: 0.7,
  },
  screenTitle: {
    ...typography.title,
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  sectionText: {
    ...typography.heading,
    padding: 10,
  },
});
