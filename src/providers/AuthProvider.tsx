import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
        // Validate the refresh token FIRST — never trust the cached flag alone.
        // Setting `authenticated` from AsyncStorage before this check lets a
        // stale install (or an unreachable backend) land straight on the
        // dashboard without login. `status` stays `loading` (blocking the
        // navigator via AuthGate) until validation resolves.
        const valid = await refreshSession();
        if (!mounted) return;

        if (!valid) {
          await signOutLocal();
          return;
        }

        const cachedProfileJson = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (cachedProfileJson) {
          try {
            const cachedProfile = JSON.parse(cachedProfileJson) as UserProfile;
            if (mounted) {
              setProfile(cachedProfile);
              setStatus('authenticated');
              await AsyncStorage.setItem(SESSION_FLAG_KEY, 'true').catch(() => {});
            }
          } catch {
            // Corrupt cache — fall through to the fresh fetch below.
          }
          // Best-effort refresh of profile data; failure keeps cached session.
          await revalidateProfile();
          return;
        }

        // Tokens are valid but we have no cached profile — fetch it.
        // Failure here means we can't build a session, so force login.
        const gotProfile = await revalidateProfile();
        if (!mounted) return;
        if (gotProfile) {
          await AsyncStorage.setItem(SESSION_FLAG_KEY, 'true').catch(() => {});
          setStatus('authenticated');
          return;
        }
        await signOutLocal();
      } catch {
        // Any unexpected failure (storage I/O, etc.) → force login screen.
        await signOutLocal();
      }
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
