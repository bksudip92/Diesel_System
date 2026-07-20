import { FuelLog } from '@/types/database';
import { getMonthlyReportByName } from '@/services/reports';
import { getLogsByDateRange } from '@/services/fuel-logs';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

function MonthlyReports() {
  const params = useLocalSearchParams();
  const [data, setData] = useState<FuelLog[]>([]);
  const monthName = params.month as string;

  useEffect(() => {
    loadMonthData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch the month's date range then fetch logs in one clean async flow.
   * This avoids the original race condition where firstMonth/lastMonth
   * closure variables were read before React state had settled.
   */
  const loadMonthData = async () => {
    const { data: report, error: reportError } = await getMonthlyReportByName(monthName);

    if (reportError || !report) {
      Alert.alert('Unable to get Monthly Data. Please Try Again');
      return;
    }

    const startDate = new Date(report.first_date).toISOString();
    const endDate = new Date(report.last_date).toISOString();

    const { data: logs, error: logsError } = await getLogsByDateRange(startDate, endDate);

    if (logsError) {
      Alert.alert('Unable to get Monthly Data. Please Try Again');
      return;
    }

    if (logs) setData(logs);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getEfficiencyColor = (eff: number | null) => {
    if (eff === null) return '#9CA3AF';
    if (eff >= 15) return '#10B981';
    if (eff < 5) return '#EF4444';
    return '#F59E0B';
  };

  const renderItem = ({ item }: { item: FuelLog }) => {
    const efficiencyColor = getEfficiencyColor(item.calculated_efficiency);

    return (
      <View style={styles.card}>
        {/* Header: Date and Place */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>{formatDate(item.transaction_date)}</Text>
            <Text style={styles.timeText}>{item.transaction_time}</Text>
          </View>
          <View style={styles.placeBadge}>
            <Ionicons name="location-sharp" size={12} color="#6B7280" />
            <Text style={styles.placeText}>{item.place}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Main Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Fuel</Text>
            <Text style={styles.statValue}>
              {item.filled_liters} <Text style={styles.unit}>L</Text>
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>
              {item.calculated_distance} <Text style={styles.unit}>km</Text>
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Efficiency</Text>
            <Text style={[styles.statValue, { color: efficiencyColor }]}>
              {item.calculated_efficiency !== null ? `${item.calculated_efficiency.toFixed(1)} ` : '— '}
              <Text style={[styles.unit, { color: efficiencyColor }]}>km/L</Text>
            </Text>
          </View>
        </View>

        {/* Footer: Odometer */}
        <View style={styles.cardFooter}>
          <Ionicons name="speedometer-outline" size={14} color="#9CA3AF" />
          <Text style={styles.odometerText}> Odometer: {item.meter_reading}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No fuel records found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  placeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  placeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: -16,
    marginBottom: -16,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  odometerText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontFamily: 'Courier',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
  },
});

export default MonthlyReports;