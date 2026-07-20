import { getMonthlyReports, refreshMonthlyReport } from '@/services/reports';
import { MonthlyReport } from '@/types/database';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface MenuListItemProps {
  item: MonthlyReport;
}

function Months() {
  const now = new Date();
  const firstDatePrev = new Date(now.getFullYear(), now.getMonth() - 1, 2).toISOString().slice(0, 10);
  const lastDatePrev = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const router = useRouter();
  const [data, setData] = useState<MonthlyReport[]>([]);

  useEffect(() => {
    getMonths();
  }, []);

  const getMonths = async () => {
    const { data: reports, error } = await getMonthlyReports();
    if (error) {
      Alert.alert('Unable to Fetch Months');
      return;
    }
    if (reports) setData(reports);
  };

  const handleRefreshData = async () => {
    const prevDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (now <= prevDate) {
      Alert.alert('No new Data to Fetch');
      return;
    }

    const monthName = now.toLocaleString('default', { month: 'long' });
    const period = `${monthName} ${now.getFullYear()}`;

    const { error } = await refreshMonthlyReport({ firstDatePrev, lastDatePrev, period });
    if (error) {
      Alert.alert('Unable to Refresh Data. Please Try Again');
      return;
    }
    // Reload list after successful refresh
    getMonths();
  };

  const MenuListItem: React.FC<MenuListItemProps> = ({ item }) => (
    <Pressable
      onPress={() => router.navigate(`/month_name?month=${item.month_name}`)}
      style={styles.listItem}
    >
      <View>
        <View style={styles.textContainer}>
          <Text style={styles.itemTitle}>{item.month_name}</Text>
          <View style={styles.statsRow}>
            {item.total_diesel ? (
              <Text style={styles.subtitleText}>Diesel: {item.total_diesel} L</Text>
            ) : null}
            {item.total_fills ? (
              <Text style={styles.statusText}>Fills: {item.total_fills}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScrollView style={styles.container}>
      <FlatList
        data={Array.isArray(data) ? data : []}
        renderItem={({ item }) => <MenuListItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No monthly reports yet.</Text>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <Pressable onPress={handleRefreshData} style={styles.button}>
        <Text style={styles.buttonText}>Refresh Data</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
    fontSize: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: 10,
    margin: 5,
  },
  textContainer: {
    flex: 1,
    margin: 5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  subtitleText: {
    fontSize: 15,
    color: '#666',
    fontWeight: 'bold',
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginHorizontal: 12,
  },
});

export default Months;