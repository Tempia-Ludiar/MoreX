import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
};

const expoSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const expoSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const nextSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const nextSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseUrl = expoSupabaseUrl || nextSupabaseUrl;
const supabaseAnonKey = expoSupabaseAnonKey || nextSupabaseAnonKey;
const fallbackSupabaseUrl = 'https://example.supabase.co';
const fallbackSupabaseAnonKey = 'missing-anon-key';
const resolvedSupabaseUrl = supabaseUrl ?? fallbackSupabaseUrl;
const resolvedSupabaseAnonKey = supabaseAnonKey ?? fallbackSupabaseAnonKey;
const serverStorage = {
  getItem: (_key: string) => Promise.resolve(null),
  removeItem: (_key: string) => Promise.resolve(),
  setItem: (_key: string, _value: string) => Promise.resolve(),
};
const authStorage = typeof window === 'undefined' ? serverStorage : AsyncStorage;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  resolvedSupabaseUrl,
  resolvedSupabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: authStorage,
    },
  },
);
