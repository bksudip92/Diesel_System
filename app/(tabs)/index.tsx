import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export interface FuelLog {
  id: number;
  filled_liters: number;
  calculated_efficiency: number | null;
  transaction_timestamp: string;
  place : string,
  vehicles: { vehicle_number: string };
}
export interface FuelLogFlat{
  id: number;
  filled_liters: number;
  calculated_efficiency: number | null;
  transaction_timestamp: string;
  place : string,
  vehicles: string ;
}
interface UserProfile {
  name: string;
  place : string ;
}

export default function Dashboard() {
  const router = useRouter();
  const params = useLocalSearchParams()
  const refresh = useIsFocused()

  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(false)


  useFocusEffect(
    // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
    useCallback(() => {
      let active = true
      fetchLogs()
      console.log("Hello, I'm focused!");
      setLoading(true)
      // Return function is invoked whenever the route gets out of focus.
      return () => {
        active = false
        console.log('This route is now unfocused.');
      };
    }, []),
   );

  const fetchLogs = async () => {

    // let UserInfo = {} as UserProfile
    // try {
    //   const jsonValue = await AsyncStorage.getItem('@user_profile');
    //    UserInfo = jsonValue ? JSON.parse(jsonValue) : {};
    //    console.log(UserInfo);
       
    // } catch (e) {
    //   console.error("Error reading user", e);
    //   Alert.alert('Error', 'Failed to read user info. Please log in again.');
    //   return;
    // }
    const place = Array.isArray(params.place) ? params.place[0] : params.place;

    const { data, error } = await supabase
      .from('fuel_logs')
      .select(`id,
              filled_liters,
              calculated_efficiency,
              calculated_distance,
              transaction_timestamp,
              place,
              vehicles(vehicle_number)`)
      .eq("place", place )
      .order('transaction_timestamp', { ascending: false })
      .limit(10);
      
      
    if (error) {
      console.log('Error fetching logs:', error);
      Alert.alert('Please Refresh, Unable to get data')
      return;
    }
    if (data) {
        const flattened: FuelLogFlat[] = (data ?? []).map((row) => ({
        id: row.id,
        filled_liters: row.filled_liters,
        calculated_efficiency: row.calculated_efficiency,
        transaction_timestamp: row.transaction_timestamp,
        place : row.place,
        
        vehicles: Array.isArray(row.vehicles)
          ? ((row.vehicles[0] as { vehicle_number?: string })?.vehicle_number ?? 'Unknown Vehicle')
          : ((row.vehicles as { vehicle_number?: string })?.vehicle_number ?? 'Unknown Vehicle'),
      }));
      // Cast to any to satisfy setLogs typing, or preferably update state and types
      setLogs(flattened as any);
      setLoading(false)
    }
  };
    
 const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const renderItem = ({ item }: { item: FuelLog }) => {
  const vehicleNumber =
    typeof item.vehicles === 'string'
      ? item.vehicles
      : Array.isArray(item.vehicles)
        ? item.vehicles[0]?.vehicle_number ?? 'Unknown Vehicle'
        : (item.vehicles as any)?.vehicle_number ?? 'Unknown Vehicle';

  // const driverName =
  //   typeof item.drivers === 'string'
  //     ? item.drivers
  //     : Array.isArray(item.drivers)
  //       ? item.drivers[0]?.driver_name ?? 'Unknown Driver'
  //       : (item.drivers as any)?.driver_name ?? 'Unknown Driver';

  return (
    <View style={styles.card}>
      {/* Header: Vehicle Number */}
      <View style={styles.header}>
        <Text style={styles.vehicleText}>{vehicleNumber}</Text>
        <Text style={styles.idText}>#{item.id}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Efficiency</Text>
          <Text style={styles.statValue}>
            {item.calculated_efficiency != null ? `${item.calculated_efficiency} km/L` : '—'}
          </Text>
        </View>
        <View style={styles.verticalLine} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Filled</Text>
          <Text style={styles.statValue}>{item.filled_liters} L</Text>
        </View>
      </View>
      

      {/* Footer: Timestamp */}
      <Text style={styles.dateText}>{formatDate(item.transaction_timestamp)}</Text>
    </View>
  );
};

return (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.contentContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Fuel Logs</Text>
      </View>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
      
    </View>
    <View style={styles.buttonContainer}>
          <Pressable onPress={() => router.navigate("/qr-scanner")} style={() => styles.button}>
              <Text style={styles.buttonText}>Scan QR</Text>
          </Pressable>
      
    </View>
  </SafeAreaView>
);
}

// 5. Styles
const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#f5f5f5',
},
contentContainer: {
  flex: 1,
  paddingHorizontal: 16,
  marginBottom : 30
},
headerRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 16,
},
screenContainer: {
  flex: 1,
  backgroundColor: '#050505', // Very dark/black background
},

// 2. The Main Rectangle Container
buttonContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems : 'center',
  marginVertical: 2,
},
button: {
  paddingVertical: 15,
  paddingHorizontal: 40,
  borderWidth: 1,
  borderColor: '#f0f0f0',
  backgroundColor: '#2563eb',
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
},
buttonText: {
  color: '#fff',
  fontSize: 20,
  fontWeight: '600',
},
screenTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#333',
},
listContent: {
  paddingBottom: 20,
},
card: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
  // Shadow for iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  // Elevation for Android
  elevation: 3,
},
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
vehicleText: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1e293b',
},
idText: {
  fontSize: 12,
  color: '#94a3b8',
},
driverText: {
  fontSize: 14,
  color: '#64748b',
  marginBottom: 12,
},
statsContainer: {
  flexDirection: 'row',
  backgroundColor: '#f8fafc',
  borderRadius: 8,
  padding: 12,
  marginBottom: 12,
},
statBox: {
  flex: 1,
  alignItems: 'center',
},
verticalLine: {
  width: 1,
  backgroundColor: '#e2e8f0',
},
statLabel: {
  fontSize: 12,
  color: '#64748b',
  marginBottom: 4,
},
statValue: {
  fontSize: 16,
  fontWeight: '600',
  color: '#0f172a',
},
dateText: {
  fontSize: 12,
  color: '#94a3b8',
  textAlign: 'right',
},
});