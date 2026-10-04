import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error("Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
}

// Custom storage using our secure IPC methods via safeStorage
const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (window.calculoAPI) {
      return await window.calculoAPI.getAuthItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (window.calculoAPI) {
      await window.calculoAPI.setAuthItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (window.calculoAPI) {
      await window.calculoAPI.removeAuthItem(key);
    }
  }
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // We're in Electron, no hash/search params automatically available
    }
  }
);
