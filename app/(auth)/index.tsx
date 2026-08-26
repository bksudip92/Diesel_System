import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthProvider';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      setErrorMsg('Invalid email or password');
      setLoading(false);
      return;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.imageSection}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.brandText}>OM SHANTI</Text>
        </View>

        <View style={styles.form}>
          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrorMsg(null); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
            style={[styles.input, loading && styles.inputDisabled]}
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrorMsg(null); }}
            secureTextEntry
            autoComplete="password"
            editable={!loading}
            style={[styles.input, loading && styles.inputDisabled]}
          />

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              loading && styles.buttonDisabled,
              pressed && !loading && styles.buttonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Login</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 160,
    height: 160,
  },
  brandText: {
    fontWeight: 'bold',
    fontSize: 22,
    marginTop: 16,
    color: '#1e293b',
  },
  form: {
    gap: 12,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  inputDisabled: {
    backgroundColor: '#e5e7eb',
    color: '#9ca3af',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonPressed: {
    backgroundColor: '#1d4ed8',
  },
});