import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons'; // Built-in with Expo
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';


interface FuelRecord {
  id: number;
  vehicle_id_fk: number;
  transaction_date: string;
  transaction_time: string;
  filled_liters: number;
  meter_reading: number;
  calculated_distance: number;
  calculated_efficiency: number;
  place: string;
}

function MonthlyReports() {
  const params = useLocalSearchParams()
  const [ FirstDate , setFirstDate ] = useState()
  const [ LastDate , setLastDate ] = useState()
  const [ data , setData ] = useState<FuelRecord[]>([])
  const MonthName = params.month // sending parameter and receiving parameter should be same,
  console.log(MonthName);
  let firstMonth = ''
  let lastMonth = ''


 useEffect(() => {
   GetMonthDates()
 
 }, [])
 
 const GetMonthDates = async () => {

  const { data, error: GetError } = await supabase
  .from('monthly_reports')
  .select('*')
  .eq("month_name", MonthName)

  if (GetError) {
    Alert.alert("Unable to get Monthly Data. Please Try Again")
    console.error("Fetch Error:", GetError);
    throw GetError;
  }

  if (data && data.length > 0) {
    firstMonth = new Date(data[0].first_date).toISOString()
    lastMonth = new Date(data[0].last_date).toISOString()
    setFirstDate(firstMonth as any )
    setLastDate(lastMonth as any)
    GetMonthlyLogs()
    console.log("monthly dates",data)
  }
 }

 const GetMonthlyLogs = async () => {
  console.log("sec func",firstMonth, typeof(firstMonth ));
  console.log(lastMonth, typeof(lastMonth ));
  
  const { data, error: GetError } = await supabase
  .from('fuel_logs')
  .select('*')
  .gte('transaction_date', firstMonth)
  .lt('transaction_date', lastMonth)

  if (GetError) {
    Alert.alert("Unable to get Monthly Data. Please Try Again")
    console.error("Fetch Error:", GetError);
    throw GetError;
  }

  if (data) {
    console.log("fuels data2",data);
    setData(data as any)
    
  }
 }

 const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

// 3. Helper: Efficiency Color Logic
const getEfficiencyColor = (eff: number) => {
  if (eff >= 15) return '#10B981'; // Green (Good)
  if (eff < 5) return '#EF4444';   // Red (Bad)
  return '#F59E0B';                // Orange/Yellow (Average)
};

 const renderItem = ({ item }: { item: FuelRecord }) => {
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
        
        {/* Fuel */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Fuel</Text>
          <Text style={styles.statValue}>
            {item.filled_liters} <Text style={styles.unit}>L</Text>
          </Text>
        </View>

        {/* Distance */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>
            {item.calculated_distance} <Text style={styles.unit}>km</Text>
          </Text>
        </View>

        {/* Efficiency (Highlighted) */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Efficiency</Text>
          <Text style={[styles.statValue, { color: efficiencyColor }]}>
            {item.calculated_efficiency.toFixed(1)} <Text style={[styles.unit, { color: efficiencyColor }]}>km/L</Text>
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
    <View>
      <FlatList
        data={data ? data : []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No fuel records found.</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light grey background
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
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
    marginHorizontal: -16, // Pull to edges
    marginBottom: -16,     // Pull to bottom
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
    fontFamily: 'Courier', // Monospace font for numbers often looks better
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
  }
});


export default MonthlyReports 