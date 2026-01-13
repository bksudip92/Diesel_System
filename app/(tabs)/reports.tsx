import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <Pressable style={styles.section} onPress={() => router.navigate('/all-vehicles')}>
          <Text  style={styles.sectionText}> All Vehicles </Text>
      </Pressable>

      {/* <DropdownComponent/> */}

      <Pressable style={styles.section} onPress={() => router.navigate('/yearly-report')}>
          <Text  style={styles.sectionText}> Yearly Report </Text>
      </Pressable>

      <Pressable style={styles.section} onPress={() => router.push('/month')}>
          <Text style={styles.sectionText}> Monthly Report </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding : 20,
    margin : 30
  },
  text: {
    color: '#fff',
  },
  section : {
    width : "100%",
    height : 60,
    borderRadius : 3,
    margin : 1,
    padding : 2,
    justifyContent : 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation : 2,
  },
  sectionText : {
    fontSize : 20,
    fontWeight : "bold",
    padding : 10
  }
});
