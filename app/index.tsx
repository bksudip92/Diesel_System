import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface UserProfile {
  name: string;
  location: string;
}

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('') 

  // useEffect(() => {
  //   const { data , error } = await supabase
  //     .storage
  //     .from('Image')
  //     .getPublicUrl("https://ekiedurclpnzdhwftmod.supabase.co/storage/v1/object/sign/Images/bk.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YTVmYjQ5MS0xMWIzLTQ5ZmMtYWI1ZS1iZTJiNDJkNGZmMDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvYmsuanBnIiwiaWF0IjoxNzY3OTU0ODI1LCJleHAiOjIwODMzMTQ4MjV9.TV7HXhac6rJ_z9yeQjZBwyuiIx10bP4FosDLa6H1Iu0")

  
  //   return () => {
  //     second
  //   }
  // }, [third])
  
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
    
    if (error || !data) {
      Alert.alert('Login failed', 'Invalid username or password')
      console.log(error)
      return
    }
    if (data && data.length > 0) {
      console.log("data",data[0].username,data[0].password)
      router.navigate(`/dashboard`)

      const saveUser = async (user: UserProfile) => {
        try {
          const jsonValue = JSON.stringify(user);
          await AsyncStorage.setItem('@user_profile', jsonValue);
        } catch (e) {
          console.error("Error saving user", e);
        }
      };
      saveUser(data[0])
    }
    console.log("data",data)
    router.navigate(`/dashboard`)

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
        value={username}
        onChangeText={setUsername}
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