import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Vehicle QR code generation / export.
 *
 * Uses the QR generation web service (as before) and expo-file-system's
 * `legacy` entry point, which is the officially supported location for
 * `downloadAsync` on SDK 54. Migrating to the new `File` API is a
 * follow-up once its download surface stabilizes.
 */

const QR_API_BASE = 'https://api.qrserver.com/v1/create-qr-code/';
const ALBUM_NAME = 'Vehicle QR Codes';

export function buildQrImageUrl(vehicleNumber: string): string {
  return `${QR_API_BASE}?size=350x350&data=${encodeURIComponent(vehicleNumber)}`;
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

/** Downloads the QR PNG to cache and returns the local file URI. */
export async function downloadQrCode(vehicleNumber: string): Promise<string> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error('Cache directory is unavailable on this device');

  const safeName = vehicleNumber.replace(/[^a-zA-Z0-9-]/g, '');
  const localUri = `${cacheDir}qr-code-${safeName}-${Date.now()}.png`;
  const result = await FileSystem.downloadAsync(buildQrImageUrl(vehicleNumber), localUri);

  if (result.status !== 200) {
    throw new Error(`QR service returned status ${result.status}`);
  }
  return result.uri;
}

/** Downloads and saves the QR code into the device gallery. */
export async function saveQrToGallery(vehicleNumber: string): Promise<void> {
  const uri = await downloadQrCode(vehicleNumber);
  const asset = await MediaLibrary.createAssetAsync(uri);
  await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
}

/** Downloads and opens the system share sheet for the QR image. */
export async function shareQrCode(vehicleNumber: string): Promise<void> {
  const uri = await downloadQrCode(vehicleNumber);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: `QR Code for ${vehicleNumber}`,
  });
}
