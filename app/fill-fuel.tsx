import { FuelLogWithVehicle, Vehicle } from '@/types/database';
import { createFuelLog, getLastFuelLog } from '@/services/fuel-logs';
import { getVehicleByNumber } from '@/services/vehicles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface UserInfo {
  name: string | null;
  place: string | null;
}

export default function FillFuel() {
  const router = useRouter();
  const params = useLocalSearchParams<{ vehicleId: string | string[] }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;

  const [loading, setLoading] = useState<boolean>(true);
  const [lastFuelLog, setLastFuelLog] = useState<FuelLogWithVehicle | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<Vehicle | null>(null);
  const [meterReading, setMeterReading] = useState('');
  const [filledLiters, setFilledLiters] = useState('');

  useEffect(() => {
    if (!vehicleId) {
      Alert.alert('Error', 'Please Scan the QR Again');
      setLoading(false);
      return;
    }
    Promise.all([fetchLastFuelLog(), fetchVehicle()]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLastFuelLog = async () => {
    if (!vehicleId) return;
    const { data, error } = await getLastFuelLog(vehicleId);
    if (error) {
      Alert.alert("Can't able to Fetch data");
      return;
    }
    setLastFuelLog(data);
  };

  const fetchVehicle = async () => {
    if (!vehicleId) return;
    const { data, error } = await getVehicleByNumber(vehicleId);
    if (error) return;
    if (data) {
      setVehicleInfo(data);
    }
  };

  // Memoized calculations — only recalc when inputs change (Phase 5.5 fix)
  const calculatedDistance = useMemo(() => {
    if (lastFuelLog && meterReading) {
      const reading = parseFloat(meterReading);
      const previousReading = lastFuelLog.meter_reading || 0;
      return reading > previousReading ? reading - previousReading : 0;
    }
    return 0;
  }, [lastFuelLog, meterReading]);

  const calculatedEfficiency = useMemo(() => {
    const filled = parseFloat(filledLiters);
    return calculatedDistance > 0 && filled > 0
      ? (calculatedDistance / filled).toFixed(2)
      : '0';
  }, [calculatedDistance, filledLiters]);

  const handleSubmit = async () => {
    let userInfo = {} as UserInfo;
    try {
      const jsonValue = await AsyncStorage.getItem('@user_profile');
      userInfo = jsonValue ? JSON.parse(jsonValue) : {};
    } catch {
      Alert.alert('Error', 'Failed to read user info. Please log in again.');
      return;
    }
    const place = userInfo.place ?? '';
    const reading = parseFloat(meterReading);
    const filled = parseFloat(filledLiters);

    if (!reading || reading <= 0) {
      Alert.alert('Error', 'Please enter a valid meter reading');
      return;
    }
    const previousReading = lastFuelLog?.meter_reading || 0;
    if (reading <= previousReading) {
      Alert.alert('Error', 'New meter reading must be greater than previous reading');
      return;
    }
    if (!filled || filled <= 0) {
      Alert.alert('Error', 'Filled liters must be greater than 0');
      return;
    }

    // Confirmation before submit (Phase 7.4 fix)
    Alert.alert(
      'Confirm Fuel Log',
      `Distance: ${calculatedDistance} km\nFilled: ${filled} L\nEfficiency: ${calculatedEfficiency} km/L\n\nSubmit?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            const { error } = await createFuelLog({
              vehicle_number: vehicleId!,
              meter_reading: reading,
              filled_liters: filled,
              place,
              transaction_date: new Date().toISOString().slice(0, 10),
              transaction_time: new Date().toLocaleTimeString().slice(16, 24),
            });

            if (error) {
              Alert.alert('Error', 'Failed to create fuel log entry');
              return;
            }

            Alert.alert('Success', 'Fuel log entry created successfully!', [
              { text: 'OK', onPress: () => router.replace('/(tabs)') },
            ]);
            setMeterReading('');
            setFilledLiters('');
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading fuel log data...</Text>
      </View>
    );
  }

  if (!vehicleId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Vehicle ID Not Found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const previousReading = lastFuelLog?.meter_reading || 0;

  const VehicleInfoCard = ({ info }: { info: Vehicle }) => (
    <View style={styles.TopCard}>
      <View style={styles.TopRow}>
        <Text style={styles.TopLabel}>Vehicle :</Text>
        <Text style={styles.TopValue}>{info.vehicle_number}</Text>
      </View>
      <View style={styles.TopRow}>
        <Text style={styles.TopLabel}>Name:</Text>
        <Text style={styles.TopValue}>{info.vehicle_name}</Text>
      </View>
      <View style={styles.TopRow}>
        <Text style={styles.TopLabel}>Owner:</Text>
        <Text style={styles.TopValue}>{info.owner_name}</Text>
      </View>
      <View style={styles.TopRow}>
        <Text style={styles.TopLabel}>Department:</Text>
        <Text style={styles.TopValue}>{info.department}</Text>
      </View>
      <View style={styles.TopRow}>
        <Text style={styles.TopLabel}>Organization:</Text>
        <Text style={styles.TopValue}>{info.organization}</Text>
      </View>
      <View style={styles.TopRow}>
        <Text style={styles.TopLabel}>Place:</Text>
        <Text style={styles.TopValue}>{info.place}</Text>
      </View>
      <View style={styles.TopRow}>
        <Text style={styles.TopLabel}>Permitted Liters:</Text>
        <Text style={styles.TopValue}>{info.permitted_liters}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {vehicleInfo ? (
        <VehicleInfoCard info={vehicleInfo} />
      ) : (
        <View style={styles.centerContainer}>
          <Text>No vehicle data found. Please scan again.</Text>
        </View>
      )}

      {/* Fuel Log Entry Form */}
      <View style={styles.card}>
        <Text style={styles.formTitle}>Add Fuel Log Entry</Text>

        <Text style={styles.inputLabel}>New Meter Reading (km) *</Text>
        <TextInput
          style={styles.input}
          value={meterReading}
          onChangeText={setMeterReading}
          placeholder={`Previous: ${previousReading} km`}
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Filled Liters *</Text>
        <TextInput
          style={styles.input}
          value={filledLiters}
          onChangeText={setFilledLiters}
          placeholder="Enter filled liters"
          keyboardType="decimal-pad"
        />

        {/* Calculated Values */}
        {calculatedDistance > 0 && (
          <View style={styles.calculatedCard}>
            <Text style={styles.calculatedTitle}>Calculated Values</Text>

            <View style={styles.calculatedRow}>
              <Text style={styles.calculatedLabel}>Distance:</Text>
              <Text style={styles.calculatedValue}>{calculatedDistance} km</Text>
            </View>

            {parseFloat(filledLiters) > 0 && (
              <View style={styles.calculatedRow}>
                <Text style={styles.calculatedLabel}>Efficiency:</Text>
                <Text style={styles.calculatedValue}>{calculatedEfficiency} km/L</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Fuel Log Entry</Text>
        </TouchableOpacity>
      </View>

      {lastFuelLog && (
        <View style={styles.card}>
          <Text style={styles.title}>Vehicle Info</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Previous Meter Reading:</Text>
            <Text style={styles.meterValue}>{previousReading} km</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Department :</Text>
            <Text style={styles.value}>{vehicleInfo?.department}</Text>
          </View>

          {lastFuelLog.calculated_efficiency && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Last Efficiency:</Text>
              <Text style={styles.value}>{lastFuelLog.calculated_efficiency.toFixed(2)} km/L</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>Organization :</Text>
            <Text style={styles.value}>{vehicleInfo?.organization}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  TopCard: {
    backgroundColor: '#fff667',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  TopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  TopLabel: {
    fontSize: 18,
    color: '#9a3412',
    fontWeight: '900',
  },
  TopValue: {
    fontSize: 17,
    color: '#7c2d12',
    fontWeight: '900',
    textAlign: 'right',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    marginTop: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  meterValue: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  calculatedCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  calculatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginTop: 12,
  },
  calculatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  calculatedLabel: {
    fontSize: 14,
    color: '#1e40af',
  },
  calculatedValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});