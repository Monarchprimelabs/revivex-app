import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Client-side Strava helpers. Everything that touches Strava itself runs in
 * Edge Functions; the app only reads its own connection status, enqueues
 * pushes and invokes the functions. Tokens never reach the client.
 */

export type StravaActivityKind = 'workout' | 'run' | 'hybrid';
export type StravaPushStatus = 'queued' | 'uploading' | 'processing' | 'done' | 'failed' | 'duplicate';

export interface StravaConnectionStatus {
  athleteId: number;
  scope: string;
  connectedAt: string;
  revokedAt: string | null;
}

export interface StravaPushRecord {
  id: string;
  activityKind: StravaActivityKind;
  activityClientId: string;
  status: StravaPushStatus;
  error: string | null;
  stravaActivityId: number | null;
  createdAt: string;
}

export interface StravaPushCounts {
  processed: number;
  done: number;
  failed: number;
  duplicate: number;
}

export async function getStravaConnectionStatus(client: SupabaseClient): Promise<StravaConnectionStatus | null> {
  const { data, error } = await client.from('strava_connection_status').select('athlete_id, scope, connected_at, revoked_at').maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { athleteId: Number(data.athlete_id), scope: String(data.scope ?? ''), connectedAt: String(data.connected_at), revokedAt: data.revoked_at ? String(data.revoked_at) : null };
}

export async function listStravaPushes(client: SupabaseClient, userId: string): Promise<StravaPushRecord[]> {
  const { data, error } = await client
    .from('strava_pushes')
    .select('id, activity_kind, activity_client_id, status, error, strava_activity_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    activityKind: row.activity_kind as StravaActivityKind,
    activityClientId: String(row.activity_client_id),
    status: row.status as StravaPushStatus,
    error: row.error ? String(row.error) : null,
    stravaActivityId: row.strava_activity_id ? Number(row.strava_activity_id) : null,
    createdAt: String(row.created_at),
  }));
}

export async function startStravaConnect(client: SupabaseClient, returnTo: string): Promise<{ url?: string; error?: string }> {
  const { data, error } = await client.functions.invoke<{ url?: string; error?: string }>('strava-connect', { method: 'POST', body: { returnTo } });
  if (error) return { error: error.message || 'Could not start the Strava connection.' };
  if (data?.error) return { error: data.error };
  return { url: data?.url };
}

export async function disconnectStrava(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await client.functions.invoke<{ ok?: boolean; error?: string }>('strava-disconnect', { method: 'POST' });
  if (error) return error.message || 'Could not disconnect.';
  return data?.error ?? null;
}

/**
 * Queues an activity for Strava (or re-queues a failed one) and runs the
 * push worker for this user. The activity row must already be mirrored.
 */
export async function requestStravaPush(client: SupabaseClient, userId: string, kind: StravaActivityKind, activityClientId: string): Promise<{ counts?: StravaPushCounts; error?: string; alreadyPosted?: boolean }> {
  const { error: insertError } = await client.from('strava_pushes').insert({ user_id: userId, activity_kind: kind, activity_client_id: activityClientId });
  if (insertError) {
    if (insertError.code !== '23505') return { error: insertError.message };
    const { data: existing } = await client.from('strava_pushes').select('id, status').eq('user_id', userId).eq('activity_kind', kind).eq('activity_client_id', activityClientId).maybeSingle();
    if (existing?.status === 'done') return { alreadyPosted: true };
    if (existing && (existing.status === 'failed' || existing.status === 'duplicate')) {
      await client.from('strava_pushes').delete().eq('id', existing.id);
      const { error: retryError } = await client.from('strava_pushes').insert({ user_id: userId, activity_kind: kind, activity_client_id: activityClientId });
      if (retryError) return { error: retryError.message };
    }
  }
  const { data, error } = await client.functions.invoke<StravaPushCounts & { error?: string }>('strava-push', { method: 'POST', body: {} });
  if (error) return { error: error.message || 'The push could not run.' };
  if (data?.error) return { error: data.error };
  return { counts: data ?? { processed: 0, done: 0, failed: 0, duplicate: 0 } };
}
