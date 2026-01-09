import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { supabase } from '../lib/supabase';

interface FuelLog {
  log_id: number;
  vehicle_id_fk: number;
  meter_reading: number;
  previous_meter_reading: number;
  filled_liters: number;
  calculated_efficiency: number | null;
  transaction_timestamp: string;
}

interface UserProfile {
  name: string | null;
  location: string | null ;
}

export interface FuelLogWithVehicle {
  meter_reading: number;
  calculated_distance: number;
  calculated_efficiency: number
}

export interface Vehicle_Info {
  vehicle_number : number,
  vehicle_name : string,
  vehicle_id :number,
  owner_name : string,
  department : string,
  organization : string,
  permitted_liters : number,
  place : string
}


export default function FillFuel() {
  const router = useRouter();
  const params = useLocalSearchParams<{ vehicleId: string | string[] }>();

  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;

  const [loading, setLoading] = useState<boolean>(true);

  const [lastFuelLog, setLastFuelLog] = useState<FuelLogWithVehicle | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<Vehicle_Info | null>(null);
  const [vehicleIdFK, setVehicleIdFK] = useState<number | null>(null);
  //const [driverIdFK , setdriverIdFK] = useState<number | null>(null);

  const [meterReading, setMeterReading] = useState('');
  const [filledLiters, setFilledLiters] = useState('');

  useEffect(() => {
    if (vehicleId) {
      fetchLastFuelLog();
      getVehicle_Info();
    }
    else {
        Alert.alert('Error', 'Please Scan the QR Again');
        setLoading(false);
        return;
    }
  }, [vehicleId]);
  
  const fetchLastFuelLog = async () => {
    
    try {
      setLoading(true);
      
      if (!vehicleId) {
        Alert.alert('Error', 'No vehicle ID provided');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("fuel_logs_with_vehicle")     // This is fetching View not Table
        .select("*")       
        .eq("vehicle_number", vehicleId )     // To make we get only specific vehicle logs
        .limit(5)
    
      // if (error) {
      //   throw error;
      // }

      if (data) {
        if (Array.isArray(data) && data.length > 0) {
          setLastFuelLog(data[0]);
          
        } else {
          setLastFuelLog(null);
        }
      }
      // If no data, that's okay - it means this is the first fuel log for this vehicle
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Could not load fuel log data');
      setLoading(false);
    }
  };

  const getVehicle_Info = async () => {
    try {
      const { data , error } = await supabase
        .from('vehicle_info')
        .select("*")
        .eq("vehicle_number", vehicleId );

        if (data) {
          if (Array.isArray(data) && data.length > 0) {
            setVehicleInfo(data[0]);
            setVehicleIdFK(data[0].vehicle_id)
            // setVehicleIdFK(data[0].driverIdFK)
            
          } else {
            //setVehicleInfo(null);
          }
        }
        else console.log(error) ; 

    } catch (error) {
      console.log(error)
    }
  }
  

  const calculateDistance = () => {
    if (lastFuelLog && meterReading) {
      const reading = parseFloat(meterReading);
      const previousReading = lastFuelLog.meter_reading || 0;
      return reading > previousReading 
        ? reading - previousReading 
        : 0;
    }
    return 0;
  };

  const calculateEfficiency = () => {
    const distance = calculateDistance();
    const filled = parseFloat(filledLiters);
    return distance > 0 && filled > 0 ? (distance / filled).toFixed(2) : '0';
  };

  const handleSubmit = async () => {

    let UserInfo = {} as UserProfile
    try {
      const jsonValue = await AsyncStorage.getItem('@user_profile');
       UserInfo = jsonValue ? JSON.parse(jsonValue) : {};
    } catch (e) {
      console.error("Error reading user", e);
      Alert.alert('Error', 'Failed to read user info. Please log in again.');
      return;
    }
    const place = (UserInfo as any).place ?? '';
    
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

    const distance = calculateDistance();
    const efficiency = parseFloat(calculateEfficiency());
    

    try {
      const { error: insertError } = await supabase
        .from('fuel_logs')
        .insert({
          vehicle_id_fk: vehicleIdFK,
          meter_reading: reading,
          previous_meter_reading: previousReading,
          calculated_distance: distance,
          filled_liters: filled,
          calculated_efficiency: efficiency,
          place : place,
          transaction_timestamp: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      Alert.alert('Success', 'Fuel log entry created successfully!', [
        {
          text: 'OK',
          onPress: () => router.push("/dashboard"),
        },
      ]);
      
      // Reset form
      setMeterReading('');
      setFilledLiters('');
    } 
    catch (error) {
      console.error('Error submitting fuel log:', error);
      Alert.alert('Error', 'Failed to create fuel log entry');
    }
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
        <TouchableOpacity style={styles.button} onPress={() => router.push("/dashboard")}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const previousReading = lastFuelLog?.meter_reading || 0;

const VehicleInfoCard = ({ info }: { info: Vehicle_Info }) => (
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
        {calculateDistance() > 0 && (
          <View style={styles.calculatedCard}>
            <Text style={styles.calculatedTitle}>Calculated Values</Text>
            
            <View style={styles.calculatedRow}>
              <Text style={styles.calculatedLabel}>Distance:</Text>
              <Text style={styles.calculatedValue}>{calculateDistance()} km</Text>
            </View>

            {parseFloat(filledLiters) > 0 && (
              <View style={styles.calculatedRow}>
                <Text style={styles.calculatedLabel}>Efficiency:</Text>
                <Text style={styles.calculatedValue}>{calculateEfficiency()} km/L</Text>
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
            <Text style={styles.value}>
              {vehicleInfo?.organization}
            </Text>
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
  TopTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7c2d12',
    marginTop: 4,
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
    marginTop: 10
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
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 20,
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