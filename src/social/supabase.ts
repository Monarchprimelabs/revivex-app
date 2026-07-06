import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for ReviveX social (Phase 39).
 *
 * Configuration comes from app.json → expo.extra.supabaseUrl / supabaseAnonKey.
 * Until the owner fills those in, getSupabase() returns null and every social
 * surface shows a "cloud not configured" state — the rest of the app is
 * unaffected. Database schema: docs/supabase/schema.sql.
 */

let client: SupabaseClient | null | undefined;

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const extra = Constants.expoConfig?.extra as
    | { supabaseUrl?: string; supabaseAnonKey?: string }
    | undefined;
  const url = extra?.supabaseUrl?.trim();
  const anonKey = extra?.supabaseAnonKey?.trim();
  if (!url || !anonKey || !url.startsWith('https://')) return null;
  return { url, anonKey };
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const config = getSupabaseConfig();
  if (!config) {
    client = null;
    return client;
  }

  client = createClient(config.url, config.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
