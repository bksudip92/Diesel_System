import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function VehicleDetails() {
  const params = useLocalSearchParams()
  const  vehicleId  = params.vehicleId
  console.log("vhei",vehicleId)
  return (
    <View>
      <Text>Vehicle Details for ID: {vehicleId}</Text>
    </View>
  );
}