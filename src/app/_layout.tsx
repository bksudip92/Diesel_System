import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppProviders, useAuth } from '@/src/providers';
import { LoadingView } from '@/src/components/ui';
import { colors } from '@/src/theme/tokens';

/** Blocks the whole navigator until the session check resolves. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingView />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AuthGate>
        <StatusBar style="dark" backgroundColor={colors.background} />
        <Stack screenOptions={{ headerTitleStyle: { color: colors.textPrimary } }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
      </AuthGate>
    </AppProviders>
  );
}
