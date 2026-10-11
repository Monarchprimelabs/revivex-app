// Starts the Strava OAuth round trip for the signed-in user.
// POST { returnTo } -> { url }
import { authorizeUrl, isAllowedReturnTo } from '../_shared/strava-core.ts';
import { callerFrom, corsHeaders, env, functionsBaseUrl, json, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const caller = await callerFrom(req);
  if (!caller) return json({ error: 'Sign in first' }, 401);

  let returnTo = '';
  try {
    const body = (await req.json()) as { returnTo?: string };
    returnTo = typeof body.returnTo === 'string' ? body.returnTo : '';
  } catch {
    // no body
  }
  if (!isAllowedReturnTo(returnTo)) return json({ error: 'returnTo is not an allowed app link' }, 400);

  const state = crypto.randomUUID();
  const admin = serviceClient();
  await admin.from('strava_oauth_states').delete().lt('expires_at', new Date().toISOString());
  const { error } = await admin.from('strava_oauth_states').insert({ state, user_id: caller.id, return_to: returnTo });
  if (error) return json({ error: error.message }, 500);

  const redirectUri = `${functionsBaseUrl()}/strava-callback`;
  return json({ url: authorizeUrl(env('STRAVA_CLIENT_ID'), redirectUri, state) });
});
