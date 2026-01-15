import { Directory, File, Paths } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';


// async function fetchImage() {
//   const url = 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=UP-02-AG-2354';
// const destination = new Directory(Paths.cache, 'png');
// try {
//   destination.create();
//   const output = await File.downloadFileAsync(url, destination);
//   console.log(output.exists); // true
//   console.log(output.uri); // path to the downloaded file, e.g., '${cacheDirectory}/pdfs/sample.pdf'
// } catch (error) {
//   console.error(error);
// }
// }



function QRShow() {
  const params = useLocalSearchParams();
  const vehicleId = Array.isArray(params.vehicle_number) ? params.vehicle_number[0] : params.vehicle_number;
  console.log("receving",vehicleId);
  const router = useRouter()

  const [qrCodeUrl, setQrCodeUrl] = useState(
    `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(vehicleId)}`,
  )
  console.log(qrCodeUrl);
  
  useEffect(() => {
    async function DownloadImage() {
      //const fileName = `qr-code-${Date.now()}.png`
  
      const destination = new Directory(Paths.cache, 'png')
      try {
        destination.create();
        console.log(qrCodeUrl);
        
        const output = await File.downloadFileAsync(qrCodeUrl, destination);
        console.log(output.exists); // true
        console.log(output.uri); // path to the downloaded file, e.g., '${cacheDirectory}/pdfs/sample.pdf'
      } catch (error) {
        Alert.alert("Failed to Download QR")
        console.error("download error",error);
      }
    }
    DownloadImage()
  }, [])

  async function ShareQR() {
    try{
      await Sharing.shareAsync(qrCodeUrl, {
        mimeType: "image/png",
        UTI: "com.compuserve.gif",
      })
    }catch(error) {
      Alert.alert("Can't Share this QR")
      console.log(error)
    }
   
  }
  
 
  return (
   <View style={styles.container}>
      <Text style={{fontSize: 40}}>Vehicle QR</Text>
      {qrCodeUrl && (
          <View style={styles.QR}>
            <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />

            <Pressable style={styles.button} onPress={ShareQR}>
               <Text style={styles.buttonText}> Share QR </Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => router.navigate("/(tabs)")}>
               <Text style={styles.buttonText}> Back to Dashboard </Text>
            </Pressable>
          </View>
        )}
    </View>
  )
}


const styles = StyleSheet.create({
  container : {
    height : "100%",
    width : "100%"
  },
  QR : {
    marginLeft : "auto",
    marginRight : "auto",
    marginHorizontal : "auto",
    marginVertical : 40


  },
  qrImage: {
    width: 300,
    height: 300,
  },
  button: {
    flex: 1,
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
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
})
export default QRShow