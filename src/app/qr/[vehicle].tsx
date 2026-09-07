import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  buildQrImageUrl,
  requestMediaLibraryPermission,
  saveQrToGallery,
  shareQrCode,
} from '@/src/features/vehicles/qr';
import { getErrorMessage } from '@/src/lib/errors';
import { colors, radius, spacing, shadow } from '@/src/theme/tokens';

export default function VehicleQrScreen() {
  const params = useLocalSearchParams<{ vehicle?: string | string[] }>();
  const vehicleNumber = Array.isArray(params.vehicle) ? params.vehicle[0] : params.vehicle;

  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const qrUrl = buildQrImageUrl(vehicleNumber ?? '');

  const handleSave = async () => {
    if (!vehicleNumber) return;
    setSaving(true);
    try {
      if (!(await requestMediaLibraryPermission())) {
        alert('Permission denied. Enable gallery access in Settings to save the QR code.');
        return;
      }
      await saveQrToGallery(vehicleNumber);
      alert('QR code saved to your gallery.');
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!vehicleNumber) return;
    setSharing(true);
    try {
      await shareQrCode(vehicleNumber);
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrCard}>
        {vehicleNumber ? (
          <Image source={{ uri: qrUrl }} style={styles.qrImage} contentFit="contain" />
        ) : null}
        <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
        <Text style={styles.hint}>Scan this code at the fuel station to pre-fill the vehicle.</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.buttonText}>Save to Gallery</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.shareButton]}
        onPress={handleShare}
        disabled={sharing}
      >
        {sharing ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.primary }]}>Share</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  qrCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadow,
  },
  qrImage: {
    width: 280,
    height: 280,
  },
  vehicleNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.md,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + 4,
    minHeight: 52,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  shareButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
