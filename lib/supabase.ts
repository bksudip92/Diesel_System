import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

export const SUPABASE_URL = 'https://ekiedurclpnzdhwftmod.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_X3xgwcuMRvY9QR6eF0iHbw_rn31-dE2';

// On the server (SSR) AsyncStorage accesses `window` which doesn't exist,
// so we fall back to a simple in-memory store to avoid the crash.
const isServer = typeof window === 'undefined';

const noopStorage = {
  getItem: (_key: string) => Promise.resolve(null),
  setItem: (_key: string, _value: string) => Promise.resolve(),
  removeItem: (_key: string) => Promise.resolve(),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: isServer ? noopStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});