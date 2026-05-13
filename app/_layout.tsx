import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { Slot, Stack, useSegments, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

function AppNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Not signed in → redirect to auth
      router.replace('/(auth)');
    } else if (session && inAuthGroup) {
      // Signed in → redirect to tabs
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen
        name="qr-scanner"
        options={{
          presentation: 'modal',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="qr-show" />
      <Stack.Screen name="fill-fuel" />
      <Stack.Screen
        name="month"
        options={{ headerTitle: 'Monthly Reports' }}
      />
      <Stack.Screen name="month_name" />
      <Stack.Screen name="yearly-report" />
      <Stack.Screen
        name="all-vehicles"
        options={{ headerTitle: 'All Vehicles List' }}
      />
      <Stack.Screen
        name="edit-vehicle"
        options={{ headerTitle: 'Vehicle Information' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard />
    </AuthProvider>
  );
}

function AuthGuard() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});