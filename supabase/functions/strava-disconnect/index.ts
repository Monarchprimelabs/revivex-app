// Revokes the user's Strava token and forgets the connection.
import { callerFrom, corsHeaders, env, json, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const caller = await callerFrom(req);
  if (!caller) return json({ error: 'Sign in first' }, 401);

  const admin = serviceClient();
  const { data: connection } = await admin.from('strava_connections').select('access_token, revoked_at').eq('user_id', caller.id).maybeSingle();
  if (connection?.access_token && !connection.revoked_at) {
    const body = new URLSearchParams({ client_id: env('STRAVA_CLIENT_ID'), client_secret: env('STRAVA_CLIENT_SECRET'), access_token: connection.access_token });
    let response = await fetch('https://www.strava.com/oauth/revoke', { method: 'POST', body });
    if (response.status === 404) {
      response = await fetch(`https://www.strava.com/oauth/deauthorize?access_token=${encodeURIComponent(connection.access_token)}`, { method: 'POST' });
    }
    // A failed revoke still removes the local connection; the user can also revoke from Strava settings.
  }
  const { error } = await admin.from('strava_connections').delete().eq('user_id', caller.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
});
