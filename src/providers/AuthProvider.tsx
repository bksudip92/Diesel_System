import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshSession } from '@/src/lib/api-client';
import { clearTokens, getRefreshToken } from '@/src/lib/secure-storage';
import * as authService from '@/src/features/auth/api';
import type { UserProfile } from '@/src/types/models';

const PROFILE_STORAGE_KEY = 'user_profile';
const SESSION_FLAG_KEY = 'is_logged_in';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthContextValue {
  status: AuthStatus;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Authentication state owner.
 *
 * Replaces the previous provider whose `session: { user: { email } }` shape
 * was a Supabase shim, and which screens bypassed by reading profile data
 * from a differently-named AsyncStorage key (`@user_profile` vs
 * `user_profile`) — a bug that silently submitted fuel logs with a blank
 * place. Consumers now use `status` + `profile`.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const signOutLocal = useCallback(async () => {
    await AsyncStorage.multiRemove([PROFILE_STORAGE_KEY, SESSION_FLAG_KEY]).catch(() => {});
    await clearTokens().catch(() => {});
    setProfile(null);
    setStatus('guest');
  }, []);

  const persistSession = useCallback(async (prof: UserProfile) => {
    await AsyncStorage.multiSet([
      [SESSION_FLAG_KEY, 'true'],
      [PROFILE_STORAGE_KEY, JSON.stringify(prof)],
    ]).catch(() => {});
    setProfile(prof);
    setStatus('authenticated');
  }, []);

  const revalidateProfile = useCallback(async (): Promise<boolean> => {
    try {
      const data = await authService.fetchProfile();
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data)).catch(() => {});
      setProfile(data);
      return true;
    } catch {
      return false;
    }
  }, []);

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
          // Fast path — unblock the UI with cached data, then verify quietly.
          setProfile(cachedProfile);
          setStatus('authenticated');

          const valid = await refreshSession();
          if (!mounted) return;
          if (!valid) {
            await signOutLocal();
            return;
          }
          await revalidateProfile();
          return;
        }
      } catch {
        // AsyncStorage read failed — fall through to the session check below.
      }

      // No usable cache: try to recover a session from a refresh token.
      const valid = await refreshSession();
      if (!mounted) return;

      if (valid) {
        const gotProfile = await revalidateProfile();
        if (gotProfile) {
          await AsyncStorage.setItem(SESSION_FLAG_KEY, 'true').catch(() => {});
          setStatus('authenticated');
          return;
        }
      }
      await signOutLocal();
    };

    initialize();
    return () => {
      mounted = false;
    };
  }, [revalidateProfile, signOutLocal]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const prof = await authService.login(email.trim(), password);
      await persistSession(prof);
    },
    [persistSession],
  );

  const signOut = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } finally {
      await signOutLocal();
    }
  }, [signOutLocal]);

  const value = useMemo(
    () => ({ status, profile, signIn, signOut }),
    [status, profile, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
