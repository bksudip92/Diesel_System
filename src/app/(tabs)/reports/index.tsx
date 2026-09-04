import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Routes } from '@/src/navigation/routes';
import { colors, shadow, spacing } from '@/src/theme/tokens';

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

  return (
    <View style={styles.container}>
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
  sectionText: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 10,
    color: colors.textPrimary,
  },
});
