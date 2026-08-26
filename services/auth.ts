import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, clearTokens, storeTokens } from '@/lib/api';
import type { UserProfile } from '@/types/database';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    place: string;
    name: string | null;
  };
}

/**
 * Logs in against the backend API and persists the token pair.
 * Throws ApiRequestError on invalid credentials.
 */
export async function login(email: string, password: string): Promise<UserProfile> {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    anonymous: true,
  });

  await storeTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });

  const profile: UserProfile = {
    id: res.user.id,
    email: res.user.email,
    place: res.user.place,
    name: res.user.name ?? undefined,
  };
  return profile;
}

const REFRESH_TOKEN_KEY = 'refresh_token';

export async function logout(): Promise<void> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (refreshToken) {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      });
    } catch {
      // Best-effort — always clear local state.
    }
  }
  await clearTokens();
}
