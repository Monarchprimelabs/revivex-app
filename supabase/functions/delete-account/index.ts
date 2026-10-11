// Supabase Edge Function: delete-account
// Deletes the calling user's auth account. Every table references
// profiles(id) -> auth.users(id) with ON DELETE CASCADE, so cloud data goes
// with it. Deploy with `supabase functions deploy delete-account`.
// The service role key is read from the function's environment and never
// leaves the server.
import { createClient } from 'npm:@supabase/supabase-js@2.110.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Missing session' }, 401);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json({ error: 'Function is not configured' }, 500);

  // Resolve the caller from their own JWT. Never trust a user id from the body.
  const asUser = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const {
    data: { user },
    error: userError,
  } = await asUser.auth.getUser();
  if (userError || !user) return json({ error: 'Invalid session' }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, deletedUserId: user.id });
});
