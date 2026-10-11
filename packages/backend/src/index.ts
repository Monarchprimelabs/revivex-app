/**
 * @revivex/backend
 * Config-gated Supabase client factory shared by Direction A and Direction B.
 *
 * Only the publishable anon key ever reaches the client. Service-role keys,
 * Strava client secrets and user tokens live in Supabase Edge Function
 * secrets and service-role-only tables (see db/schema.sql).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type { SupabaseClient };

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/** Minimal storage contract matching AsyncStorage and the Supabase auth storage adapter. */
export interface KeyValueStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Reads `expo.extra.supabaseUrl` / `expo.extra.supabaseAnonKey` style config.
 * Returns null until both values are present and the URL is https, so every
 * cloud surface can show a "not configured" state instead of failing.
 */
export function readSupabaseConfig(extra: unknown): SupabaseConfig | null {
  const record = (extra ?? {}) as { supabaseUrl?: unknown; supabaseAnonKey?: unknown };
  const url = typeof record.supabaseUrl === 'string' ? record.supabaseUrl.trim() : '';
  const anonKey = typeof record.supabaseAnonKey === 'string' ? record.supabaseAnonKey.trim() : '';
  if (!url || !anonKey || !url.startsWith('https://')) return null;
  return { url, anonKey };
}

export function createRevivexSupabaseClient(config: SupabaseConfig, storage: KeyValueStorage): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
