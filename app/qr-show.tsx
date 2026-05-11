import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from "expo-sharing";
import React, { useEffect } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';


function QRShow() {
  const params = useLocalSearchParams();
  const vehicleId = Array.isArray(params.vehicle_number) ? params.vehicle_number[0] : params.vehicle_number;
  console.log("receiving", vehicleId);
  const router = useRouter()

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(vehicleId)}`;
  console.log(qrCodeUrl);

  useEffect(() => {
    async function DownloadImage() {
      try {
        // 1. Ask for media library permission (required on Android to save to gallery)
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            "Permission Denied",
            "Storage permission is required to save the QR code to your gallery."
          );
          return;
        }

        console.log("before download", qrCodeUrl);

        // 2. Download image to app's cache directory using the stable FileSystem API
        const fileName = `qr-code-${vehicleId}-${Date.now()}.png`;
        const cacheDir: string = (FileSystem as any).cacheDirectory ?? '';
        const localUri = cacheDir + fileName;

        const downloadResult = await FileSystem.downloadAsync(qrCodeUrl, localUri);

        console.log("download finished, status:", downloadResult.status);
        console.log("local uri:", downloadResult.uri);

        if (downloadResult.status !== 200) {
          throw new Error(`Server returned status ${downloadResult.status}`);
        }

        // 3. Save the downloaded file to the device's media library (visible in gallery)
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync("Vehicle QR Codes", asset, false);

        Alert.alert("Success", "QR code saved to your gallery in 'Vehicle QR Codes' album.");
        console.log("Saved to gallery:", asset.uri);

      } catch (error) {
        Alert.alert("Failed to Download QR", String(error));
        console.error("download error", error);
      }
    }

    DownloadImage();
  }, []);

  async function ShareQR() {
    try {
      // Download first, then share the local file for reliable sharing
      const fileName = `qr-code-${vehicleId}.png`;
      const cacheDir: string = (FileSystem as any).cacheDirectory ?? '';
      const localUri = cacheDir + fileName;
      const { uri } = await FileSystem.downloadAsync(qrCodeUrl, localUri);
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `QR Code for ${vehicleId}`,
      });
    } catch (error) {
      Alert.alert("Can't Share this QR");
      console.log(error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 40 }}>Vehicle QR</Text>
      {qrCodeUrl && (
        <View style={styles.QR}>
          <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />

          <Pressable style={styles.button} onPress={ShareQR}>
            <Text style={styles.buttonText}> Share QR </Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.buttonText}> Back to Dashboard </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%"
  },
  QR: {
    marginLeft: "auto",
    marginRight: "auto",
    marginHorizontal: "auto",
    marginVertical: 40


  },
  qrImage: {
    width: 300,
    height: 300,
  },
  button: {
    flex: 1,
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    backgroundColor: '#fffff0',
    fontSize: 16,
    fontWeight: '600',
  },
})
export default QRShow