import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

declare const process: {
  env: {
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
    'Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
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
