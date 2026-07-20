import { useAuth } from '@/context/AuthProvider';
import { getRecentLogs } from '@/services/fuel-logs';
import { FuelLogFlat } from '@/types/database';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard() {
  const router = useRouter();
  const refresh = useIsFocused();
  const { profile } = useAuth();

  const [logs, setLogs] = useState<FuelLogFlat[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetails = async () => {
    const userPlace = profile?.place || '';
    if (!userPlace) return;

    setLoading(true);
    const { data, error } = await getRecentLogs(userPlace, 10);
    setLoading(false);

    if (error) {
      Alert.alert('Please Refresh, Unable to get data');
      return;
    }
    if (data) setLogs(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
      return () => {};
    // profile?.place is the dependency so data reloads if profile changes after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.place]),
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: FuelLogFlat }) => {
    const vehicleNumber = typeof item.vehicles === 'string' ? item.vehicles : 'Unknown Vehicle';

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
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>No fuel logs found for your location.</Text>
            ) : null
          }
        />
      </View>
      <View style={styles.buttonContainer}>
        <Pressable onPress={() => router.navigate('/qr-scanner')} style={() => styles.button}>
          <Text style={styles.buttonText}>Scan QR</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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