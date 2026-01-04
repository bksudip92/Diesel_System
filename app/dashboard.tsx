import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Dashboard() {
  const router = useRouter();
  return (
    <View style={{ padding: 40 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Dashboard
      </Text>

      <Text style={{ marginBottom: 30 }}>
        You are logged in successfully.
      </Text>

      <Button
        title="Logout"
        onPress={() => router.replace('/')}
      />
    </View>
  )
}