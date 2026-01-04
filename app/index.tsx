import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

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
      .single()

    if (error || !data) {
      Alert.alert('Login failed', 'Invalid username or password')
      console.log(error)
      return
    }

    // Login success → go to dashboard
    router.replace('/dashboard')
  }

  return (
    <View style={{ padding: 40 }}>
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