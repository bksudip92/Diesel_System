import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppProviders, useAuth } from '@/src/providers';
import { LoadingView } from '@/src/components/ui';
// import { ApiDebugOverlay } from '@/src/components/ui/ApiDebugOverlay';
import { colors } from '@/src/theme/tokens';

/** Blocks the whole navigator until the session check resolves. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'guest' && !inAuthGroup) {
      // Not signed in → login first, never the dashboard.
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && inAuthGroup) {
      // Signed in → skip login, go to tabs.
      router.replace('/(tabs)');
    }
  }, [status, segments, router]);

  if (status === 'loading') {
    return <LoadingView />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AuthGate>
        {/* `backgroundColor` is not a prop of expo-status-bar's StatusBar;
            the Android bar colour comes from expo-system-ui instead. */}
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerTitleStyle: { color: colors.textPrimary } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="scanner/index"
            options={{ headerShown: false, presentation: 'modal', gestureEnabled: false }}
          />
          <Stack.Screen name="fuel/[vehicle]" options={{ title: 'Fill Fuel' }} />
          <Stack.Screen name="qr/[vehicle]" options={{ title: 'Vehicle QR' }} />

          <Stack.Screen name="vehicles/index" options={{ title: 'All Vehicles' }} />
          <Stack.Screen name="vehicles/edit" options={{ title: 'Vehicle Information' }} />

          <Stack.Screen name="reports/months" options={{ title: 'Monthly Reports' }} />
          <Stack.Screen name="reports/months/[name]" options={{ title: 'Monthly Report' }} />
        </Stack>

        {/* Absolutely positioned and self-returning outside `__DEV__`, so this
            adds no layout box to the navigator. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/*<ApiDebugOverlay />*/}
        </View>
      </AuthGate>
    </AppProviders>
  );
}
