import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Reuse the interface
interface VehicleData {
  vehicle_id: number;
  vehicle_number: string;
  vehicle_name: string;
  current_meter_reading: number;
  owner_name: string | null;
  department: string | null;
  organization: string | null;
  permitted_liters: number;
  // ... include other fields if needed
}

// Define route params type
type RootStackParamList = {
  VehicleEdit: { vehicle: VehicleData };
};

type EditScreenRouteProp = RouteProp<RootStackParamList, 'VehicleEdit'>;

export default function VehicleEditScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditScreenRouteProp>();
  const { vehicle } = route.params;
  console.log(vehicle);
  
  // --- Local State for Form Fields ---
  const [meterReading, setMeterReading] = useState(String(vehicle.current_meter_reading));
  const [ownerName, setOwnerName] = useState(vehicle.owner_name || '');
  const [department, setDepartment] = useState(vehicle.department || '');
  const [limit, setLimit] = useState(String(vehicle.permitted_liters));
  
  const [isSaving, setIsSaving] = useState(false);

  // --- Database Update Simulation ---
  const handleSave = async () => {
    setIsSaving(true);

    // 1. Prepare the payload
    const updatedData = {
      vehicle_id: vehicle.vehicle_id,
      current_meter_reading: parseInt(meterReading),
      owner_name: ownerName,
      department: department,
      permitted_liters: parseInt(limit),
    };

    console.log("Saving to Database:", updatedData);

    // 2. Simulate API Call (e.g., Supabase or Axios)
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Success", "Vehicle information updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      
      {/* Read-Only Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{vehicle.vehicle_name}</Text>
        <Text style={styles.headerSubtitle}>{vehicle.vehicle_number}</Text>
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
    marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  
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