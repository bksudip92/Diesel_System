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
    if (data && data.length > 0 && data[0]?.username) {
      router.push(`/dashboard?userId=${encodeURIComponent(data[0].username)}&place=${encodeURIComponent(data[0].place)}`)

      const saveUser = async (user: UserProfile) => {
        try {
          const jsonValue = JSON.stringify(user);
          await AsyncStorage.setItem('@user_profile', jsonValue);
        } catch (e) {
          console.error("Error saving user", e);
        }
      };
      saveUser(data[0])
      console.log(data[0])
    }
  }

  return (
    <View style={{ padding: 40 }}>
      <View style={styles.ImageContainer}>
        <Image
          source={"./assets/images/bk.jng"} 
          style={{ width: 200, height: 200 }}
        />
        <Text> Om Shanti</Text>
      </View>
      <Text style={{ fontSize: 24, margin: 20 }}>
        Login
      </Text>

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
    height : "30%",
    width : "100%",
    justifyContent : "center",
    alignContent : "center"
  }
})