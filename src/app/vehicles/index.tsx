import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AllVehiclesScreen } from '@/src/features/vehicles/components/AllVehiclesScreen';
import { Routes } from '@/src/navigation/routes';
import type { Vehicle } from '@/src/types/models';
import { colors } from '@/src/theme/tokens';

export default function AllVehiclesRoute() {
  const router = useRouter();

  const handlePressVehicle = (vehicle: Vehicle) => {
    router.navigate(Routes.editVehicle(vehicle.vehicle_number));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <AllVehiclesScreen onPressVehicle={handlePressVehicle} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
