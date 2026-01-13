import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
}

interface UserProfile {
  id: string;
  place: string;
}

interface CombinedUserInfo {
  auth: AuthUser;
  profile: UserProfile;
}

export default function Login(){
  const router = useRouter();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('') 
  const [ data , setData ] = useState<any>()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    const { data , error } = await supabase.auth.signInWithPassword({
      email,
      password,
      });

    if (error) {
      Alert.alert("Incorrect Username and Password")
      }

    else if(data){
      setData(data)
      getPlace()
      }
    }


      // const saveUser = async (user: UserProfile) => {
      //   try {
      //     const jsonValue = JSON.stringify(user);
      //     await AsyncStorage.setItem('@user_profile', jsonValue);
      //   } catch (e) {
      //     console.error("Error saving user", e);
      //   }
      // };
      // saveUser(data[0])
      const getPlace = async () => {
        const { data , error } = await supabase
        .from('users')
        .select('*')
        .eq('email',email)
        .single()

        if ( data ){
          const place = data.place
          router.navigate(`/(tabs)?place=${encodeURIComponent(place)}`)
          console.log("User Profile response",data);
        }
        if (!data && error){
          Alert.alert("Can't find User's Place, Please fill details or Register Yourself")
          console.log(error);
        }
    }


  return (
    <View style={{ padding: 40 }}>
      <View style={styles.ImageContainer}>
        <Image
          source={"https://ekiedurclpnzdhwftmod.supabase.co/storage/v1/object/sign/Images/bk-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YTVmYjQ5MS0xMWIzLTQ5ZmMtYWI1ZS1iZTJiNDJkNGZmMDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvYmstcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3Njc5NTU4NjAsImV4cCI6MjA4MzMxNTg2MH0.j6zP3mhwixxNHvS39Oges7Y_FlsEOwaCfUesXEUaUw8"} 
          style={{ width: 200, height: 200, marginRight: "auto", marginLeft: "auto"}}
        />
         <Text style={styles.Text}> OM SHANTI</Text>
      </View>

      <TextInput
        placeholder="Username"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          marginBottom: 15,
          padding: 10,
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          marginBottom: 20,
          padding: 10,
        }}
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  )
}

const styles = StyleSheet.create({
  ImageContainer : {
    height : "50%",
    width : "100%",
    justifyContent : "center",
    alignContent : "center"
  },
  Text : {
    fontWeight : 'bold',
    fontSize : 20,
     marginRight: "auto",
     marginLeft: "auto",
    marginVertical : 50
  }
})