import { getAllVehicles } from '@/services/vehicles';
import { Vehicle } from '@/types/database';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ListRenderItem, Pressable, StyleSheet, Text, View } from 'react-native';

export default function VehicleListScreen() {
  const router = useRouter();
  const [data, setData] = useState<Vehicle[]>([]);

  const VehicleCard = ({ item, handleItemPress }: { item: Vehicle; handleItemPress: () => void }) => {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => handleItemPress()}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.label}>Vehicle No.</Text>
            <Text style={styles.vehicleNumber}>{item.vehicle_number}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Vehicle Name</Text>
            <Text style={styles.vehicleName}>{item.vehicle_name}</Text>
          </View>
        </View>
        {/* --- Divider --- */}
        <View style={styles.divider} />

        {/* --- Middle Row --- */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            Reading: <Text style={styles.infoValue}>{item.current_meter_reading} km</Text>
          </Text>
          <Text style={styles.infoText}>
            Limit: <Text style={styles.infoValue}>{item.permitted_liters}L</Text>
          </Text>
        </View>

        {/* --- Footer Row --- */}
        <View style={styles.footerRow}>
          <View style={styles.footerItemLeft}>
            <Text style={styles.label}>Owner</Text>
            <Text style={styles.ownerName} numberOfLines={1}>
              {item.owner_name || 'N/A'}
            </Text>
          </View>
          <View style={styles.footerItemRight}>
            <Text style={styles.label}>Org / Dept</Text>
            <Text style={styles.orgName} numberOfLines={1}>
              {item.organization || item.department || 'N/A'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderItem: ListRenderItem<Vehicle> = ({ item }) => (
    <VehicleCard item={item} handleItemPress={() => onCardClick(item)} />
  );

  useEffect(() => {
    fetchVehicle();
  }, []);

  const fetchVehicle = async () => {
    const { data: vehicles, error } = await getAllVehicles();
    if (error) {
      Alert.alert('Unable to Fetch Vehicles Data');
      return;
    }
    if (vehicles) setData(vehicles);
  };

  const onCardClick = (vehicle: Vehicle) => {
    router.push(`/edit-vehicle?vehicle=${vehicle.vehicle_number}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.vehicle_id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No vehicles found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: 50,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#007AFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: 2,
    fontWeight: '600',
  },
  vehicleNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
  },
  infoValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    marginHorizontal: -16,
    marginBottom: -16,
    marginTop: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  footerItemLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  footerItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  orgName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});