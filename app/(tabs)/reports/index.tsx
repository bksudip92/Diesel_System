import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  const router = useRouter()

  const Logout = async () => {
    const { error : AuthError } = await supabase.auth.signOut()
      if( AuthError ) {
        Alert.alert("Can't Logout. Please Try Again")
      }
      else if (!AuthError){
        Alert.alert("Success", "Logout Successful", [
          { text: "OK", onPress: () => router.replace('/(auth)') }
        ])
      }
  }
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

      <View style={styles.buttonContainer}>
          <Pressable onPress={Logout} style={() => styles.button}>
              <Text style={styles.buttonText}>Logout</Text>
          </Pressable>
      
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    flexDirection : 'column',
    height : "100%",
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
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems : 'center',
    marginVertical: 2,
    marginTop : 420,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
});
