import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  createRevivexSupabaseClient,
  readSupabaseConfig,
  type SupabaseClient,
  type SupabaseConfig,
} from '@revivex/backend';

/**
 * Supabase client for Revive X Direction A.
 *
 * Configuration comes from app.json → expo.extra.supabaseUrl / supabaseAnonKey.
 * Until the owner fills those in, getSupabase() returns null and every cloud
 * surface shows a "cloud not configured" state. Schema: db/schema.sql.
 */

let client: SupabaseClient | null | undefined;

export function getSupabaseConfig(): SupabaseConfig | null {
  return readSupabaseConfig(Constants.expoConfig?.extra);
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const config = getSupabaseConfig();
  if (!config) {
    client = null;
    return client;
  }

  client = createRevivexSupabaseClient(config, AsyncStorage);
  return client;
}
