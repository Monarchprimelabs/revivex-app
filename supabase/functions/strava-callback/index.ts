// Strava redirects here after the athlete approves (or denies) access.
// Deploy with --no-verify-jwt: the browser carries no Supabase session.
import { appendQuery, hasWriteScope } from '../_shared/strava-core.ts';
import { env, serviceClient } from '../_shared/supabase.ts';

function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location } });
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';
  const scope = url.searchParams.get('scope');
  const denied = url.searchParams.get('error');

  const admin = serviceClient();
  const { data: stateRow } = await admin.from('strava_oauth_states').select('user_id, return_to, expires_at').eq('state', state).maybeSingle();
  if (stateRow) await admin.from('strava_oauth_states').delete().eq('state', state);
  if (!stateRow) return new Response('This link has expired. Start again from the app.', { status: 400 });
  const returnTo = stateRow.return_to as string;
  if (new Date(stateRow.expires_at as string).getTime() < Date.now()) return redirect(appendQuery(returnTo, { strava: 'error', reason: 'expired' }));
  if (denied || !code) return redirect(appendQuery(returnTo, { strava: 'error', reason: denied ?? 'no_code' }));
  if (!hasWriteScope(scope)) return redirect(appendQuery(returnTo, { strava: 'error', reason: 'scope' }));

  const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: env('STRAVA_CLIENT_ID'), client_secret: env('STRAVA_CLIENT_SECRET'), code, grant_type: 'authorization_code' }),
  });
  if (!tokenResponse.ok) return redirect(appendQuery(returnTo, { strava: 'error', reason: `token_${tokenResponse.status}` }));
  const token = (await tokenResponse.json()) as { access_token: string; refresh_token: string; expires_at: number; athlete?: { id: number } };
  if (!token.athlete?.id) return redirect(appendQuery(returnTo, { strava: 'error', reason: 'no_athlete' }));

  const { error } = await admin.from('strava_connections').upsert(
    {
      user_id: stateRow.user_id,
      athlete_id: token.athlete.id,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: new Date(token.expires_at * 1000).toISOString(),
      scope: scope ?? '',
      connected_at: new Date().toISOString(),
      revoked_at: null,
    },
    { onConflict: 'user_id' }
  );
  if (error) return redirect(appendQuery(returnTo, { strava: 'error', reason: 'store' }));
  return redirect(appendQuery(returnTo, { strava: 'connected', athlete: String(token.athlete.id) }));
});
