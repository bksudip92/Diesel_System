import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Button,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Routes } from '@/src/navigation/routes';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

/** Side of the scan square, sized off the viewport so it never overflows. */
function frameSize(width: number) {
  return Math.min(width * 0.68, 280);
}

export default function VehicleScanner() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const frame = frameSize(width);
  // Centre the square on the viewport itself, not on the frame+label group —
  // the previous version centred the group, which left the square riding high
  // and the bottom half of the preview completely un-dimmed.
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
        onBarcodeScanned={
          scanned
            ? undefined
            : ({ data }: { data: string }) => {
                if (data) {
                  setScanned(true);
                  router.navigate(Routes.fillFuel(data));
                }
              }
        }
      />
      {!scanned ? (
        // Four scrim panels rather than one full-screen wash: the scan square
        // stays at full brightness so the decoder has a clean target, while
        // everything around it is pushed down to focus attention.
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.scrim, { top: 0, height: top }]} />
          <View style={[styles.scrim, { top: top + frame, bottom: 0 }]} />
          <View style={[styles.scrim, { top, left: 0, width: edge, height: frame }]} />
          <View style={[styles.scrim, { top, right: 0, width: edge, height: frame }]} />

          <View style={[styles.frame, { top, left: edge, width: frame, height: frame }]} />

          <Text style={[styles.hint, { top: top + frame + spacing.lg }]}>Scan Vehicle QR Code</Text>
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
    left: 0,
    right: 0,
    backgroundColor: colors.scannerScrim,
  },
  frame: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.scannerFrame,
    borderRadius: radius.xl,
    backgroundColor: 'transparent',
  },
  hint: {
    ...typography.body,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.textInverse,
  },
});
