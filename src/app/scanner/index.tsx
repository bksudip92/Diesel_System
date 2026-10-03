import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Button,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Routes } from '@/src/navigation/routes';
import { sanitizeScannedVehicleNumber } from '@/src/lib/vehicle-number';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

/** Keep the scan window usable in portrait and landscape without clipping the guidance. */
function frameSize(width: number, height: number) {
  return Math.floor(Math.min(width * 0.72, height * 0.42, 300));
}

export default function VehicleScanner() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // This screen is a `presentation: 'modal'` stack entry, so it stays mounted
  // after `router.navigate` pushes the fill-fuel form. Without this reset the
  // `scanned` latch stays true forever: the overlay never comes back and the
  // camera stops responding for the rest of the session.
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, []),
  );

  const handleScan = useCallback(
    ({ data }: { data: string }) => {
      setScanned(true);

      // A QR payload is untrusted input. Without checking it, a stray
      // character (e.g. a trailing "!") reaches the API verbatim and the
      // vehicle lookup 404s on a case-sensitive SQL compare.
      const vehicleNumber = sanitizeScannedVehicleNumber(data);
      if (!vehicleNumber) {
        Alert.alert(
          'Invalid QR Code',
          `"${data}" is not a valid vehicle number. Scan a vehicle QR issued by this app.`,
        );
        // Release the latch so the driver can immediately try another code.
        setScanned(false);
        return;
      }

      router.navigate(Routes.fillFuel(vehicleNumber));
    },
    [router],
  );

  const frame = frameSize(width, height);
  const edge = (width - frame) / 2;
  const top = (height - frame) / 2;

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
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />
      {!scanned ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Each panel owns its bounds. Keeping horizontal defaults off the
              shared style prevents the side panels from stretching full-width. */}
          <View style={[styles.scrim, { top: 0, left: 0, right: 0, height: top }]} />
          <View style={[styles.scrim, { top: top + frame, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.scrim, { top, left: 0, width: edge, height: frame }]} />
          <View style={[styles.scrim, { top, right: 0, width: edge, height: frame }]} />

          <Text style={[styles.title, { bottom: height - top + spacing.xl }]}>Scan QR Code</Text>
          <View style={[styles.frame, { top, left: edge, width: frame, height: frame }]} />
          <View style={[styles.hintContainer, { top: top + frame + spacing.lg }]}>
            <Text style={styles.hint}>Align the vehicle QR code inside the frame</Text>
            <Text style={styles.subHint}>Scanning happens automatically</Text>
          </View>
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
  scrim: {
    position: 'absolute',
    backgroundColor: colors.scannerScrim,
  },
  title: {
    ...typography.title,
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    color: colors.textInverse,
    textAlign: 'center',
  },
  frame: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.scannerFrame,
    borderRadius: radius.xl,
    backgroundColor: 'transparent',
  },
  hintContainer: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  hint: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '600',
    textAlign: 'center',
  },
  subHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
