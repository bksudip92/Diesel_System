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
    await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    setProfile(null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will fire SIGNED_OUT and clear state
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      // 1. Restore session from storage
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session) {
        setSession(data.session);
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

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);

        if (newSession?.user?.email) {
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