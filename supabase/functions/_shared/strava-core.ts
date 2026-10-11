/**
 * Pure Strava helpers shared by the Edge Functions. No Deno or Node APIs, so
 * the same file is unit-tested with tsx (supabase/tests) and bundled by Deno.
 */

export interface RoutePointLike {
  lat: number;
  lng: number;
  /** epoch milliseconds */
  t: number;
}

export interface WorkoutLike {
  title: string;
  performed_at: string;
  duration_seconds: number;
  exercises: { exerciseName?: string; sets?: { weight?: number; reps?: number; completed?: boolean }[] }[];
  notes?: string | null;
}

export interface RunLike {
  title: string;
  performed_at: string;
  duration_seconds: number;
  distance_m: number;
  run_type: string;
  notes?: string | null;
}

export interface HybridLike {
  title: string;
  performed_at: string;
  total_duration_seconds: number;
  session_type: string;
  segments: { name: string; durationSeconds?: number }[];
  notes?: string | null;
}

/** Fields accepted by POST /api/v3/activities. */
export interface ManualActivityPayload {
  name: string;
  sport_type: string;
  start_date_local: string;
  elapsed_time: number;
  description: string;
  distance?: number;
  trainer?: 0 | 1;
}

const FOOTER = 'Logged with Revive X';

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] ?? char);
}

function clampLength(text: string, max = 1000): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/** Strava expects a local wall-clock time without zone; we send the ISO instant truncated, which Strava treats as local. */
export function toStartDateLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid performed_at: ${iso}`);
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function describeWorkout(workout: WorkoutLike): string {
  const lines = (workout.exercises ?? []).map((exercise) => {
    const sets = (exercise.sets ?? []).filter((set) => set.completed !== false);
    const summary = sets
      .map((set) => (set.weight && set.weight > 0 ? `${set.weight}×${set.reps ?? 0}` : `${set.reps ?? 0} reps`))
      .join(', ');
    return `${exercise.exerciseName ?? 'Exercise'}: ${summary || 'no sets'}`;
  });
  if (workout.notes) lines.push('', workout.notes);
  lines.push('', FOOTER);
  return clampLength(lines.join('\n'));
}

export function describeHybrid(session: HybridLike): string {
  const lines = (session.segments ?? []).map((segment, index) => {
    const minutes = segment.durationSeconds ? ` ${Math.floor(segment.durationSeconds / 60)}:${String(segment.durationSeconds % 60).padStart(2, '0')}` : '';
    return `${index + 1}. ${segment.name}${minutes}`;
  });
  lines.unshift(session.session_type);
  if (session.notes) lines.push('', session.notes);
  lines.push('', FOOTER);
  return clampLength(lines.join('\n'));
}

export function workoutPayload(workout: WorkoutLike): ManualActivityPayload {
  return {
    name: workout.title || 'Strength workout',
    sport_type: 'WeightTraining',
    start_date_local: toStartDateLocal(workout.performed_at),
    elapsed_time: Math.max(1, Math.round(workout.duration_seconds)),
    description: describeWorkout(workout),
  };
}

const TREADMILL_TYPES = new Set(['Treadmill']);

export function runPayload(run: RunLike): ManualActivityPayload {
  const treadmill = TREADMILL_TYPES.has(run.run_type);
  return {
    name: run.title || 'Run',
    sport_type: treadmill ? 'VirtualRun' : 'Run',
    start_date_local: toStartDateLocal(run.performed_at),
    elapsed_time: Math.max(1, Math.round(run.duration_seconds)),
    distance: Math.max(0, Math.round(run.distance_m)),
    description: clampLength([run.run_type, run.notes ?? '', '', FOOTER].filter((line, index) => index !== 1 || line).join('\n')),
    trainer: treadmill ? 1 : 0,
  };
}

export function hybridPayload(session: HybridLike): ManualActivityPayload {
  return {
    name: session.title || 'Hybrid session',
    sport_type: 'Workout',
    start_date_local: toStartDateLocal(session.performed_at),
    elapsed_time: Math.max(1, Math.round(session.total_duration_seconds)),
    description: describeHybrid(session),
  };
}

/** GPX 1.1 track for a run with GPS points. Points are sorted by time. */
export function buildGpx(name: string, points: RoutePointLike[]): string {
  const sorted = [...points].filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)).sort((a, b) => a.t - b.t);
  if (sorted.length < 2) throw new Error('A GPX track needs at least two points');
  const trkpts = sorted
    .map((point) => `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lng.toFixed(6)}"><time>${new Date(point.t).toISOString()}</time></trkpt>`)
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="Revive X" xmlns="http://www.topografix.com/GPX/1/1">',
    '  <trk>',
    `    <name>${escapeXml(name)}</name>`,
    '    <type>running</type>',
    '    <trkseg>',
    trkpts,
    '    </trkseg>',
    '  </trk>',
    '</gpx>',
    '',
  ].join('\n');
}

export function needsRefresh(expiresAtIso: string, now: Date = new Date(), skewSeconds = 300): boolean {
  const expires = new Date(expiresAtIso).getTime();
  return !Number.isFinite(expires) || expires - now.getTime() < skewSeconds * 1000;
}

export function hasWriteScope(scope: string | null | undefined): boolean {
  return (scope ?? '').split(',').map((part) => part.trim()).includes('activity:write');
}

const ALLOWED_RETURN_PREFIXES = ['revivex://', 'revivex-daily://', 'exp://', 'exps://', 'http://localhost', 'http://127.0.0.1'];

export function isAllowedReturnTo(url: string): boolean {
  return ALLOWED_RETURN_PREFIXES.some((prefix) => url.startsWith(prefix)) && !url.includes('\n') && url.length < 2048;
}

export function appendQuery(url: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

export function authorizeUrl(clientId: string, redirectUri: string, state: string): string {
  return appendQuery('https://www.strava.com/oauth/authorize', {
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    approval_prompt: 'auto',
    scope: 'read,activity:write',
    state,
  });
}

/** Strava reports duplicates in the upload error text. */
export function isDuplicateUploadError(error: string | null | undefined): boolean {
  return /duplicate/i.test(error ?? '');
}
