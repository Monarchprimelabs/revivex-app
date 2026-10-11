// Strava webhook: subscription validation (GET) and deauthorization events (POST).
// Deploy with --no-verify-jwt. Activity events are ignored on purpose: nothing is pulled.
import { env, json, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === env('STRAVA_WEBHOOK_VERIFY_TOKEN')) {
      return json({ 'hub.challenge': url.searchParams.get('hub.challenge') });
    }
    return json({ error: 'Verification failed' }, 403);
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const event = (await req.json().catch(() => null)) as { object_type?: string; owner_id?: number; updates?: Record<string, string> } | null;
  if (event?.object_type === 'athlete' && event.updates?.authorized === 'false' && event.owner_id) {
    const admin = serviceClient();
    await admin
      .from('strava_connections')
      .update({ revoked_at: new Date().toISOString(), access_token: '', refresh_token: '' })
      .eq('athlete_id', event.owner_id);
  }
  // Strava expects a 200 within two seconds; everything else happens above or not at all.
  return json({ ok: true });
});
