import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { Text, View } from 'react-native'

function AllVehicles() {
  const router = useRouter()

  useEffect(() => {
    AllVehiclesData()
  
  }, [])
  

  const AllVehiclesData = async () => {
    const { data , error } = await supabase
      .from('vehicles')
      .select('*')

    if (data) {
      console.log(data[0].vehicle_id);
      const veh = data[0].vehicle_id

      router.push(`/vehicleId?vehicleId${encodeURIComponent(veh)}`)
    }
    if (error) {
      console.log(error);
    }
    
  }
  
  return (
    <View style={{}}>
      <Text>All Vehices</Text>
    </View>
  )
}

export default AllVehicles