import { supabase } from '@/lib/supabase';
import { RouteProp, useNavigation } from '@react-navigation/native';
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
  const params = useLocalSearchParams();
  const vehicle  = params.vehicle;
  const [ vehicleData , setVehicleData ] = useState<VehicleData>()
  console.log(vehicle);
  
  // --- Local State for Form Fields ---
  const [ vehicle_number, setvehicle_number ] = useState(vehicle)
  const [meterReading, setMeterReading] = useState(String(vehicleData?.current_meter_reading) || '');
  const [ownerName, setOwnerName] = useState(vehicleData?.owner_name || '');
  const [department, setDepartment] = useState(vehicleData?.department || '');
  const [limit, setLimit] = useState(String(vehicleData?.permitted_liters) || '');
  
  const [isSaving, setIsSaving] = useState(false);

  // --- Database Update Simulation ---
  const handleSave = async () => {
    setIsSaving(true);

    const { error: UpsertError } = await supabase
    .from('vehicles')
    .update({
      current_meter_reading : meterReading ,
      owner_name : ownerName , 
      department : department,
      permitted_liters : limit
    })
    .eq('vehicle_number',vehicle_number)

      if (UpsertError) {
        Alert.alert("Unable to Insert Data. Please Try Again")
        console.error("Upsert Error:", UpsertError);
        throw UpsertError;
      }

    else {
      Alert.alert("No new Data to Fetch")
    }


    console.log("Saving to Database");

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
        <Text style={styles.headerTitle}>
          {vehicle_number 
            ? `${vehicle_number}` 
            : "Vehicle Details"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {vehicleData?.owner_name ? `Owner: ${vehicleData.owner_name}` : ""}
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.formSection}>
        
        <Text style={styles.label}>Current Meter Reading (km)</Text>
        <TextInput
          style={styles.input}
          
          onChangeText={setMeterReading}
          keyboardType="numeric"
          placeholder="e.g. 12000"
        />

        <Text style={styles.label}>Owner Name</Text>
        <TextInput
          style={styles.input}
          
          onChangeText={setOwnerName}
          placeholder="Enter owner name"
        />

        <Text style={styles.label}>Department / Organization</Text>
        <TextInput
          style={styles.input}
          
          onChangeText={setDepartment}
          placeholder="e.g. Construction"
        />

        <Text style={styles.label}>Fuel Limit (Liters)</Text>
        <TextInput
          style={styles.input}
          
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