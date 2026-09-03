import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Routes } from '@/src/navigation/routes';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function VehicleScanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera for scanning vehicle QR codes.
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Stack.Screen options={{ headerShown: false }} />
      {Platform.OS === 'android' ? <StatusBar hidden /> : null}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : ({ data }: { data: string }) => {
          if (data) {
            setScanned(true);
            router.navigate(Routes.fillFuel(data));
          }
        }}
      />
      {!scanned ? (
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.overlayText}>Scan Vehicle QR Code</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'transparent',
    borderRadius: radius.xl,
  },
  overlayText: {
    color: 'white',
    fontSize: 16,
    marginTop: spacing.md,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: radius.sm,
  },
});
