import type * as ExpoMediaLibrary from 'expo-media-library';
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

type MediaLibraryModule = typeof ExpoMediaLibrary;

/**
 * Load the optional native module only when gallery functionality is used.
 * A stale Expo Go/dev build can then still register and render the QR route.
 */
async function getMediaLibrary(): Promise<MediaLibraryModule> {
  try {
    return await import('expo-media-library');
  } catch (error) {
    const missingNativeModule =
      error instanceof Error && error.message.includes('Cannot find native module');

    if (missingNativeModule) {
      throw new Error(
        'Gallery saving is unavailable in this app build. Update Expo Go or rebuild the development app to include expo-media-library.',
      );
    }

    throw error;
  }
}

export function buildQrImageUrl(vehicleNumber: string): string {
  return `${QR_API_BASE}?size=350x350&data=${encodeURIComponent(vehicleNumber)}`;
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const mediaLibrary = await getMediaLibrary();
  const { status } = await mediaLibrary.requestPermissionsAsync();
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
  const mediaLibrary = await getMediaLibrary();
  const uri = await downloadQrCode(vehicleNumber);
  const asset = await mediaLibrary.createAssetAsync(uri);
  await mediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
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
