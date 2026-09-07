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
        // Validate the refresh token FIRST — never trust the cached flag alone.
        // The old code set a session from AsyncStorage before this check, so a
        // stale install (or an unreachable backend) landed straight on (tabs).
        const valid = await refreshSession();
        if (!mounted) return;

        if (!valid) {
          await clearLocalState();
          return;
        }

        const cachedProfileJson = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        const cachedProfile = cachedProfileJson
          ? (JSON.parse(cachedProfileJson) as UserProfile)
          : null;

        if (cachedProfile) {
          if (mounted) {
            setProfile(cachedProfile);
            setSession({ user: { email: cachedProfile.email } });
            await AsyncStorage.setItem(SESSION_FLAG_KEY, 'true');
          }
          // Best-effort refresh of profile data; failure keeps cached session.
          await revalidateProfile();
        } else {
          // Tokens are valid but we have no cached profile — fetch it.
          // Failure here means we can't build a session, so force login.
          const ok = await revalidateProfile();
          if (!ok) {
            await clearLocalState();
          } else if (mounted) {
            const fresh = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
            if (fresh) {
              await AsyncStorage.setItem(SESSION_FLAG_KEY, 'true');
              const prof = JSON.parse(fresh) as UserProfile;
              setSession({ user: { email: prof.email } });
            } else {
              await clearLocalState();
            }
          }
        }
      } catch {
        // Any unexpected failure (storage I/O, etc.) → force login screen.
        try {
          await clearLocalState();
        } catch {
          setProfile(null);
          setSession({ user: null });
        }
      } finally {
        if (mounted) setLoading(false);
      }
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
