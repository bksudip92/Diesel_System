import { updateVehicleByNumber } from '@/services/vehicles';
import { Vehicle } from '@/types/database';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
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

export default function VehicleEditScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const vehicleNumber = params.vehicle as string;

  const [meterReading, setMeterReading] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [department, setDepartment] = useState('');
  const [limit, setLimit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    const updates: Partial<Vehicle> = {};
    if (meterReading) updates.current_meter_reading = parseFloat(meterReading);
    if (ownerName) updates.owner_name = ownerName;
    if (department) updates.department = department;
    if (limit) updates.permitted_liters = parseFloat(limit);

    if (Object.keys(updates).length === 0) {
      Alert.alert('No Changes', 'Enter at least one field to update.');
      setIsSaving(false);
      return;
    }

    const { error } = await updateVehicleByNumber(vehicleNumber as string, updates);
    setIsSaving(false);

    if (error) {
      Alert.alert('Error', 'Unable to save changes. Please try again.');
      return;
    }

    Alert.alert('Success', 'Vehicle information updated successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Read-Only Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>
          {vehicleNumber ? `${vehicleNumber}` : 'Vehicle Details'}
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Current Meter Reading (km)</Text>
        <TextInput
          style={styles.input}
          value={meterReading}
          onChangeText={setMeterReading}
          keyboardType="numeric"
          placeholder="e.g. 12000"
        />

        <Text style={styles.label}>Owner Name</Text>
        <TextInput
          style={styles.input}
          value={ownerName}
          onChangeText={setOwnerName}
          placeholder="Enter owner name"
        />

        <Text style={styles.label}>Department / Organization</Text>
        <TextInput
          style={styles.input}
          value={department}
          onChangeText={setDepartment}
          placeholder="e.g. Construction"
        />

        <Text style={styles.label}>Fuel Limit (Liters)</Text>
        <TextInput
          style={styles.input}
          value={limit}
          onChangeText={setLimit}
          keyboardType="numeric"
          placeholder="e.g. 200"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  formSection: { paddingHorizontal: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 40,
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});