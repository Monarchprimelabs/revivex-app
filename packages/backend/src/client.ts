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
  if (!url || !anonKey || !isAllowedSupabaseUrl(url)) return null;
  return { url, anonKey };
}

/** https anywhere; plain http only for local development hosts (Supabase CLI, LAN, test stand-ins). */
export function isAllowedSupabaseUrl(url: string): boolean {
  if (url.startsWith('https://')) return true;
  const match = /^http:\/\/([^/:]+)(:\d+)?(\/|$)/.exec(url);
  if (!match) return false;
  const host = match[1];
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host)
  );
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
