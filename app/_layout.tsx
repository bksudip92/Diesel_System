import { Stack } from 'expo-router';

export default function RootLayout() {

  return (
    <Stack>
      
      <Stack.Screen name="index" 
      options={{
        headerShown : false
      }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false}}/>
      <Stack.Screen
        name="qr-scanner"
        options={{
          presentation: 'modal', 
          gestureEnabled: false, 
        }}
      />

      <Stack.Screen name="qr-show" />
      <Stack.Screen name='fill-fuel'/>
      <Stack.Screen name='month'
        options={{
          headerTitle : 'Monthly Reports'
        }}
      />
      <Stack.Screen name='month_name'/>
      <Stack.Screen name='yearly-report'/>
      <Stack.Screen name='all-vehicles'
      options={{
        headerTitle : "All Vehicles List"
      }}
      />
      <Stack.Screen name='vehicleId'
      options={{
        headerTitle : "Vehicle Information"
      }}
      />

    </Stack>
  )
};