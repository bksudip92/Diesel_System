import { Directory, File, Paths } from 'expo-file-system';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

async function fetchImage() {
  const url = 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=UP-02-AG-2354';
const destination = new Directory(Paths.cache, 'png');
try {
  destination.create();
  const output = await File.downloadFileAsync(url, destination);
  console.log(output.exists); // true
  console.log(output.uri); // path to the downloaded file, e.g., '${cacheDirectory}/pdfs/sample.pdf'
} catch (error) {
  console.error(error);
}
}



function QRShow() {
  fetchImage()
  // const downloadImage = async () => {
  //   try {
  //     const fileUri = FileSystem.documentDirectory + 'qr-code.png';
  //     const { uri } = await FileSystem.downloadAsync(qrCodeUrl, fileUri);
  //     setImageUrl(uri);
  //     Alert.alert('Success', 'QR code downloaded successfully!');
  //   } catch (error) {
  //     console.error('Download error:', error);
  //     Alert.alert('Error', 'Failed to download QR code');
  //   }
  // };

//   useEffect(() => {
//     fetchImage();
//   }, []);

//   const fetchImage = async () => {
//     try {
//       const response = await fetch('https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=UP-02-AG-2354');
      
//       // Convert response to blob
//       return response.blob();
      
//       // Create a local URL for the blob
//       //const localUrl = URL.createObjectURL(blob);
      
//       //setImageUrl(localUrl as any);
//     } catch (error) {
//       console.error('Error fetching image:', error);
//     }
//   };

//   const downloadImageAndSetSource = async (imageUrl) => {
//     const image = await fetchImage(imageUrl);
//     setImageUrl(URL.createObjectURL(image));
// }

const URL = 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=UP-02-AG-2354'
  return (
   <View style={styles.container}>
      <Text style={{fontSize: 40}}>Vehicle QR</Text>
      {URL && (
        <Image 
          source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=UP-02-AG-2354' }}
          style={styles.QR}
        />
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
    marginHorizontal : "auto"

  }
})
export default QRShow