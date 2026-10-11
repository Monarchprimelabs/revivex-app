import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createRevivexSupabaseClient, readSupabaseConfig, type SupabaseClient, type SupabaseConfig } from '@revivex/backend';

/**
 * Supabase client for Revive X Direction B. Configuration comes from
 * app.json → expo.extra.supabaseUrl / supabaseAnonKey. Null until configured.
 */
let client: SupabaseClient | null | undefined;

export function getSupabaseConfig(): SupabaseConfig | null {
  return readSupabaseConfig(Constants.expoConfig?.extra);
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const config = getSupabaseConfig();
  client = config ? createRevivexSupabaseClient(config, AsyncStorage) : null;
  return client;
}
