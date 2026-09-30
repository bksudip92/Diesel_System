import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FuelLogFlat } from '@/src/types/models';
import { useAuth } from '@/src/providers';
import { useRecentLogs } from '@/src/features/fuel-logs/queries';
import { DashboardLogCard } from '@/src/features/fuel-logs/components/DashboardLogCard';
import { EmptyState, ErrorState, LoadingView } from '@/src/components/ui';
import { Routes } from '@/src/navigation/routes';
import { colors, spacing, typography } from '@/src/theme/tokens';

export default function Dashboard() {
  const router = useRouter();
  // The tabs navigator hides its own header, so this screen draws the title
  // itself — it has to apply the status-bar inset or the title sits under it.
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const logsQuery = useRecentLogs(profile?.place, 10);

  const renderItem = ({ item }: { item: FuelLogFlat }) => <DashboardLogCard log={item} />;

  if (!profile?.place) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <ErrorState message="Your profile has no place assigned. Contact an administrator." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Fuel Logs</Text>
      </View>

      {logsQuery.isPending ? (
        <LoadingView />
      ) : logsQuery.isError ? (
        <ErrorState message="Unable to load fuel logs." onRetry={() => logsQuery.refetch()} />
      ) : (
        <FlatList
          data={logsQuery.data ?? []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={logsQuery.isRefetching}
              onRefresh={() => logsQuery.refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={<EmptyState message="No fuel logs found for your location." />}
        />
      )}

      <View style={styles.buttonContainer}>
        <Pressable onPress={() => router.navigate(Routes.scanner)} style={() => styles.button}>
          <Text style={styles.buttonText}>Scan QR</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xs / 2,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 20,
    fontWeight: '600',
  },
  screenTitle: {
    ...typography.title,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
});
