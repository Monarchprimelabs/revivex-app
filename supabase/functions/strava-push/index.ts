// Drains the signed-in user's Strava push outbox: uploads GPX for runs with a
// trace, creates manual activities for everything else.
// POST {} -> { processed, done, failed, duplicate }
import { buildGpx, hybridPayload, isDuplicateUploadError, needsRefresh, runPayload, workoutPayload, type ManualActivityPayload } from '../_shared/strava-core.ts';
import { callerFrom, corsHeaders, env, json, serviceClient } from '../_shared/supabase.ts';

const API = 'https://www.strava.com/api/v3';

interface Connection {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  revoked_at: string | null;
}

async function freshAccessToken(admin: ReturnType<typeof serviceClient>, connection: Connection): Promise<string> {
  if (!needsRefresh(connection.expires_at)) return connection.access_token;
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: env('STRAVA_CLIENT_ID'), client_secret: env('STRAVA_CLIENT_SECRET'), grant_type: 'refresh_token', refresh_token: connection.refresh_token }),
  });
  if (!response.ok) throw new Error(`Token refresh failed (${response.status})`);
  const token = (await response.json()) as { access_token: string; refresh_token: string; expires_at: number };
  await admin
    .from('strava_connections')
    .update({ access_token: token.access_token, refresh_token: token.refresh_token, expires_at: new Date(token.expires_at * 1000).toISOString() })
    .eq('user_id', connection.user_id);
  return token.access_token;
}

async function createManual(accessToken: string, payload: ManualActivityPayload): Promise<{ id?: number; error?: string; status: number }> {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) if (value !== undefined) form.set(key, String(value));
  const response = await fetch(`${API}/activities`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form });
  const body = (await response.json().catch(() => ({}))) as { id?: number; message?: string; errors?: unknown[] };
  if (!response.ok) return { error: `${body.message ?? 'Strava error'} ${JSON.stringify(body.errors ?? [])}`.trim(), status: response.status };
  return { id: body.id, status: response.status };
}

async function uploadGpx(accessToken: string, gpx: string, payload: ManualActivityPayload): Promise<{ activityId?: number; uploadId?: number; error?: string; duplicate?: boolean; status: number }> {
  const form = new FormData();
  form.set('file', new Blob([gpx], { type: 'application/gpx+xml' }), 'activity.gpx');
  form.set('data_type', 'gpx');
  form.set('name', payload.name);
  form.set('description', payload.description);
  form.set('sport_type', payload.sport_type);
  if (payload.trainer) form.set('trainer', '1');
  const response = await fetch(`${API}/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form });
  const body = (await response.json().catch(() => ({}))) as { id?: number; error?: string | null; activity_id?: number | null; message?: string };
  if (!response.ok) return { error: body.message ?? body.error ?? 'Upload failed', status: response.status };
  if (!body.id) return { error: 'Upload returned no id', status: response.status };
  // Poll until processed (uploads are asynchronous).
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const poll = await fetch(`${API}/uploads/${body.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const status = (await poll.json().catch(() => ({}))) as { error?: string | null; activity_id?: number | null };
    if (status.error) return { uploadId: body.id, error: status.error, duplicate: isDuplicateUploadError(status.error), status: poll.status };
    if (status.activity_id) return { uploadId: body.id, activityId: status.activity_id, status: poll.status };
  }
  return { uploadId: body.id, error: 'Still processing; will finish on Strava', status: 202 };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const caller = await callerFrom(req);
  if (!caller) return json({ error: 'Sign in first' }, 401);

  const admin = serviceClient();
  const { data: connection } = await admin.from('strava_connections').select('user_id, access_token, refresh_token, expires_at, revoked_at').eq('user_id', caller.id).maybeSingle();
  if (!connection || connection.revoked_at) return json({ error: 'Strava is not connected' }, 409);

  const { data: queue } = await admin
    .from('strava_pushes')
    .select('id, activity_kind, activity_client_id')
    .eq('user_id', caller.id)
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(10);
  if (!queue || queue.length === 0) return json({ processed: 0, done: 0, failed: 0, duplicate: 0 });

  let accessToken: string;
  try {
    accessToken = await freshAccessToken(admin, connection as Connection);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Token refresh failed' }, 502);
  }

  const counts = { processed: 0, done: 0, failed: 0, duplicate: 0 };
  for (const push of queue) {
    counts.processed += 1;
    await admin.from('strava_pushes').update({ status: 'uploading' }).eq('id', push.id);
    try {
      let result: { id?: number; activityId?: number; uploadId?: number; error?: string; duplicate?: boolean; status: number };
      if (push.activity_kind === 'workout') {
        const { data } = await admin.from('workouts').select('title, performed_at, duration_seconds, exercises, notes').eq('user_id', caller.id).eq('client_id', push.activity_client_id).maybeSingle();
        if (!data) throw new Error('Workout is not in the cloud yet');
        result = await createManual(accessToken, workoutPayload(data));
      } else if (push.activity_kind === 'run') {
        const { data } = await admin.from('runs').select('title, performed_at, duration_seconds, distance_m, run_type, notes').eq('user_id', caller.id).eq('client_id', push.activity_client_id).maybeSingle();
        if (!data) throw new Error('Run is not in the cloud yet');
        const { data: route } = await admin.from('run_routes').select('points').eq('user_id', caller.id).eq('client_id', push.activity_client_id).maybeSingle();
        const payload = runPayload(data);
        if (route && Array.isArray(route.points) && route.points.length >= 2) {
          result = await uploadGpx(accessToken, buildGpx(payload.name, route.points), payload);
        } else {
          result = await createManual(accessToken, payload);
        }
      } else {
        const { data } = await admin.from('hybrid_sessions').select('title, performed_at, total_duration_seconds, session_type, segments, notes').eq('user_id', caller.id).eq('client_id', push.activity_client_id).maybeSingle();
        if (!data) throw new Error('Session is not in the cloud yet');
        result = await createManual(accessToken, hybridPayload(data));
      }

      if (result.status === 429) {
        await admin.from('strava_pushes').update({ status: 'queued', error: 'Strava rate limit reached; will retry' }).eq('id', push.id);
        break;
      }
      const activityId = result.activityId ?? result.id;
      if (activityId) {
        await admin.from('strava_pushes').update({ status: 'done', strava_activity_id: activityId, strava_upload_id: result.uploadId ?? null, error: null }).eq('id', push.id);
        counts.done += 1;
      } else if (result.duplicate) {
        await admin.from('strava_pushes').update({ status: 'duplicate', strava_upload_id: result.uploadId ?? null, error: result.error ?? null }).eq('id', push.id);
        counts.duplicate += 1;
      } else {
        await admin.from('strava_pushes').update({ status: result.status === 202 ? 'processing' : 'failed', strava_upload_id: result.uploadId ?? null, error: result.error ?? 'Unknown error' }).eq('id', push.id);
        if (result.status !== 202) counts.failed += 1;
      }
    } catch (error) {
      counts.failed += 1;
      await admin.from('strava_pushes').update({ status: 'failed', error: error instanceof Error ? error.message : String(error) }).eq('id', push.id);
    }
  }
  return json(counts);
});
