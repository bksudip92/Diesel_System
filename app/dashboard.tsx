import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

type FuelLog = {
  id: string;
  driver_name: string;
  diesel_liters: number;
  average_kmpl?: number;
  created_at: string;
  vehicles?: {
    registration_number: string;
  };
};

export default function Dashboard() {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('fuel_logs')
      .select('*, vehicles(registration_number)')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
    
    // Optional: Subscribe to Realtime changes so the list updates instantly
    const subscription = supabase
      .channel('public:fuel_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fuel_logs' }, 
        () => {
          // When a new scan happens, re-fetch or prepend the new item
          fetchLogs(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const renderItem = ({ item }: { item: FuelLog }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          {/* Vehicle Number - The most important info */}
          <Text style={styles.regNumber}>
            {item.vehicles?.registration_number || 'Unknown Vehicle'}
          </Text>
          <Text style={styles.driverName}>{item.driver_name}</Text>
        </View>
        <View style={styles.rightSide}>
          <Text style={styles.fuelAmount}>{item.diesel_liters} L</Text>
          {/* Conditional rendering for efficiency if available */}
          {item.average_kmpl && (
            <Text style={styles.efficiency}>{item.average_kmpl} km/L</Text>
          )}
        </View>
      </View>
      <Text style={styles.timestamp}>
        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Recent Transactions</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchLogs} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5', padding: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    // Shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  regNumber: { fontSize: 18, fontWeight: '700', color: '#111' },
  driverName: { fontSize: 14, color: '#666', marginTop: 4 },
  rightSide: { alignItems: 'flex-end' },
  fuelAmount: { fontSize: 18, fontWeight: '600', color: '#059669' }, // Green for fuel
  efficiency: { fontSize: 12, color: '#666', marginTop: 2 },
  timestamp: { fontSize: 11, color: '#999', marginTop: 12, textAlign: 'right' },
});