import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useVehiclesList } from '@/src/features/vehicles/queries';
import { VehicleCard } from '@/src/features/vehicles/components/VehicleCard';
import type { Vehicle } from '@/src/types/models';
import { EmptyState, ErrorState, LoadingView } from '@/src/components/ui';
import { colors, spacing } from '@/src/theme/tokens';

interface AllVehiclesScreenProps {
  onPressVehicle: (vehicle: Vehicle) => void;
}

/**
 * All Vehicles list. Uses a stable renderItem callback and a card component
 * defined outside the list (the old screen redefined its row component in
 * render and kept the fetch state hand-rolled).
 */
export function AllVehiclesScreen({ onPressVehicle }: AllVehiclesScreenProps) {
  const vehiclesQuery = useVehiclesList();

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <VehicleCard vehicle={item} onPress={() => onPressVehicle(item)} />
  );

  if (vehiclesQuery.isPending) {
    return <LoadingView />;
  }

  if (vehiclesQuery.isError) {
    return (
      <ErrorState message="Unable to load vehicles." onRetry={() => vehiclesQuery.refetch()} />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vehiclesQuery.data ?? []}
        keyExtractor={(item) => String(item.vehicle_id)}
        renderItem={renderVehicle}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={vehiclesQuery.isRefetching}
            onRefresh={() => vehiclesQuery.refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            message="No vehicles registered yet."
            hint="Add your first vehicle from the Create tab."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
});
