import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, refreshSession } from '@/lib/api';
import * as authService from '@/services/auth';

export interface UserProfile {
  id: string;
  email: string;
  place: string;
  name?: string;
}

interface AuthContextValue {
  session: { user: { email: string } | null };
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: { user: null },
  profile: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

const PROFILE_STORAGE_KEY = 'user_profile';
const SESSION_FLAG_KEY = 'is_logged_in';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthContextValue['session']>({ user: null });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Best-effort background revalidation against the API.
  const revalidateProfile = async (): Promise<boolean> => {
    try {
      const data = await apiFetch<UserProfile>('/users/me');
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
      setProfile(data);
      return true;
    } catch {
      return false;
    }
  };

  const clearLocalState = async () => {
    await AsyncStorage.multiRemove([PROFILE_STORAGE_KEY, SESSION_FLAG_KEY]);
    setProfile(null);
    setSession({ user: null });
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const [loginFlag, cachedProfileJson] = await AsyncStorage.multiGet([
          SESSION_FLAG_KEY,
          PROFILE_STORAGE_KEY,
        ]);

        const isLoggedIn = loginFlag[1] === 'true';
        const cachedProfile = cachedProfileJson[1]
          ? (JSON.parse(cachedProfileJson[1]) as UserProfile)
          : null;

        if (isLoggedIn && cachedProfile && mounted) {
          // Instant fast path — unblock UI with cached data.
          setProfile(cachedProfile);
          setSession({ user: { email: cachedProfile.email } });
          setLoading(false);

          // Verify the session is actually still valid in the background.
          const valid = await refreshSession();
          if (!mounted) return;
          if (!valid) {
            await clearLocalState();
            return;
          }
          await revalidateProfile();
          return;
        }
      } catch {
        // AsyncStorage read failed — fall through to normal path
      }

      const valid = await refreshSession();
      if (!mounted) return;

      if (valid) {
        const cachedProfileJson = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        const cachedProfile = cachedProfileJson
          ? (JSON.parse(cachedProfileJson) as UserProfile)
          : null;
        if (cachedProfile) {
          setProfile(cachedProfile);
          setSession({ user: { email: cachedProfile.email } });
          await AsyncStorage.setItem(SESSION_FLAG_KEY, 'true');
          await revalidateProfile();
        }
      } else {
        await clearLocalState();
      }

      if (mounted) setLoading(false);
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const prof = await authService.login(email.trim(), password);
    await AsyncStorage.setItem(SESSION_FLAG_KEY, 'true');
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(prof));
    setProfile(prof);
    setSession({ user: { email: prof.email } });
  };

  const signOut = async () => {
    await authService.logout();
    await clearLocalState();
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
