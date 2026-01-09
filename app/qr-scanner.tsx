import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function VehicleScanner() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // useEffect(() => {
  //   const getCameraPermissions = async () => {
  //     // const { status } = await Camera.requestCameraPermissionsAsync();
  //     // setHasPermission(status === 'granted');
  //     if (!hasPermission?.granted) {
  //       await requestPermission();
  //   };
  // }
  //   getCameraPermissions();
  // }, [hasPermission]);

  // const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
  //   if (data) {
  //     router.push(`/fill-fuel?vehicleId=${encodeURIComponent(data)}` as any);
  //     console.log(data, typeof(data))
  //     return
  //   };
  //   setScanned(true);
  // }

  // if (hasPermission === null) {
  //   return (
  //     <View style={styles.container}>
  //       <Text>Requesting camera permission...</Text>
  //     </View>
  //   );

  // if (hasPermission?.granted) {
  //   return (
  //     <View style={styles.container}>
  //       <Text>No access to camera</Text>
  //     </View>
  //   );
  // }

  if (!hasPermission?.granted) {
    return (
      <View>
        <Text>We need your permission to show the camera</Text>
        <Button onPress={setHasPermission} title="Grant permission" />
      </View>
    );
  }
  return (
    <SafeAreaProvider style={StyleSheet.absoluteFillObject}>
      <Stack.Screen
        options={{
          title: "Overview",
          headerShown: false,
        }}
      />
      {Platform.OS === "android" ? <StatusBar hidden /> : null}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={({ data }: { data: string }) => {
          if (data) {
            router.push(`/fill-fuel?vehicleId=${encodeURIComponent(data)}` as any);
            console.log(data, typeof data);
            return;
          }
          setScanned(true);
        }}
        />
      {!scanned && (
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.overlayText}>Scan Vehicle QR Code</Text>
        </View>
      )}
    </SafeAreaProvider>
  );

}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
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
    borderRadius: 20,
  },
  overlayText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 5,
  },
});