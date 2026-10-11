// Deno-only helpers for the Edge Functions: clients, caller resolution, responses.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.110.0';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export function serviceClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Resolves the calling user from the Authorization header. Null when missing or invalid. */
export async function callerFrom(req: Request): Promise<{ id: string } | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const asUser = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: `Bearer ${token}` } } });
  const {
    data: { user },
  } = await asUser.auth.getUser();
  return user ? { id: user.id } : null;
}

export function functionsBaseUrl(): string {
  // https://<ref>.supabase.co -> https://<ref>.supabase.co/functions/v1
  return `${env('SUPABASE_URL').replace(/\/$/, '')}/functions/v1`;
}
