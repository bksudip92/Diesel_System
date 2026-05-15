import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  place: string;
  name?: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

const PROFILE_STORAGE_KEY = 'user_profile';
const SESSION_FLAG_KEY = 'is_logged_in';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userEmail: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      if (data) {
        const profileData: UserProfile = {
          id: data.id,
          email: data.email,
          place: data.place,
          name: data.name,
        };
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
        return profileData;
      }
      return null;
    } catch (e) {
      console.error('Profile fetch exception:', e);
      return null;
    }
  };

  const clearProfile = async () => {
    await AsyncStorage.multiRemove([PROFILE_STORAGE_KEY, SESSION_FLAG_KEY]);
    setProfile(null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will fire SIGNED_OUT and clear state
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      // ─── FAST PATH: check AsyncStorage for cached login flag ───
      // This is instant (no network) and lets us skip the login page
      // before Supabase SDK finishes restoring its session.
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
          // Immediately unblock the UI — user sees tabs, not login
          setProfile(cachedProfile);
          setSession({ user: { email: cachedProfile.email } } as unknown as Session);
          setLoading(false);

          // Now verify real session from Supabase in the background
          supabase.auth.getSession().then(async ({ data }) => {
            if (!mounted) return;

            if (data.session) {
              // Real session is valid — swap in the real session object
              setSession(data.session);
              // Silently refresh profile in background
              const userEmail = data.session.user.email;
              if (userEmail) {
                const freshProfile = await fetchProfile(userEmail);
                if (mounted && freshProfile) setProfile(freshProfile);
              }
            } else {
              // Session expired — force back to login
              setSession(null);
              await clearProfile();
            }
          });
          return; // Fast path done — don't block on Supabase below
        }
      } catch {
        // AsyncStorage read failed — fall through to normal path
      }

      // ─── NORMAL PATH: no cached login flag, wait for Supabase ───
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session) {
        setSession(data.session);

        // Save login flag + fetch profile
        await AsyncStorage.setItem(SESSION_FLAG_KEY, 'true');
        const userEmail = data.session.user.email;
        if (userEmail) {
          const prof = await fetchProfile(userEmail);
          if (mounted) setProfile(prof);
        }
      } else {
        setSession(null);
        await clearProfile();
      }
      if (mounted) setLoading(false);
    };

    initialize();

    // Subscribe to auth state changes (handles fresh login / sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);

        if (newSession?.user?.email) {
          await AsyncStorage.setItem(SESSION_FLAG_KEY, 'true');
          const prof = await fetchProfile(newSession.user.email);
          if (mounted) setProfile(prof);
        } else {
          await clearProfile();
        }

        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);