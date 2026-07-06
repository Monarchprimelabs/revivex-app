import type { DistanceUnit, RoutePoint, RunSplit } from '../types';

/**
 * GPS run tracking engine. Pure and Node-testable: the screen feeds raw
 * location fixes into advanceTrack() and renders the returned state.
 */

export const METERS_PER_MILE = 1609.344;
export const METERS_PER_KM = 1000;

/** Fixes with worse horizontal accuracy than this are discarded. */
export const MAX_ACCURACY_METERS = 25;
/** Ignore jitter: movements smaller than this don't accumulate. */
export const MIN_STEP_METERS = 2;
/** Discard teleports faster than this (m/s) — GPS glitches. */
export const MAX_SPEED_MPS = 12.5;

export interface GpsFix {
  lat: number;
  lng: number;
  t: number; // epoch ms
  accuracy?: number;
}

export interface TrackState {
  distanceMeters: number;
  points: RoutePoint[];
  splits: RunSplit[];
  /** Meters into the current (incomplete) lap. */
  lapMeters: number;
  /** Epoch ms when the current lap started (moving time base). */
  lapStartedAt: number | null;
  lastFix: GpsFix | null;
}

export function createTrackState(): TrackState {
  return {
    distanceMeters: 0,
    points: [],
    splits: [],
    lapMeters: 0,
    lapStartedAt: null,
    lastFix: null,
  };
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function lapLengthMeters(unit: DistanceUnit): number {
  return unit === 'km' ? METERS_PER_KM : METERS_PER_MILE;
}

/**
 * Feed one GPS fix into the track. Returns a new state; the input state is
 * not mutated. Bad fixes (poor accuracy, teleports, jitter) are ignored.
 */
export function advanceTrack(state: TrackState, fix: GpsFix, unit: DistanceUnit): TrackState {
  if (!Number.isFinite(fix.lat) || !Number.isFinite(fix.lng) || !Number.isFinite(fix.t)) {
    return state;
  }
  if (fix.accuracy !== undefined && fix.accuracy > MAX_ACCURACY_METERS) {
    return state;
  }

  const point: RoutePoint = { lat: fix.lat, lng: fix.lng, t: fix.t };

  if (!state.lastFix) {
    return {
      ...state,
      points: [...state.points, point],
      lapStartedAt: fix.t,
      lastFix: fix,
    };
  }

  const dtSeconds = (fix.t - state.lastFix.t) / 1000;
  if (dtSeconds <= 0) return state;

  const step = haversineMeters(state.lastFix, fix);
  if (step / dtSeconds > MAX_SPEED_MPS) {
    // Teleport glitch: keep the fix as the new anchor, don't add distance.
    return { ...state, lastFix: fix };
  }
  if (step < MIN_STEP_METERS) {
    return { ...state, lastFix: fix };
  }

  const lapLength = lapLengthMeters(unit);
  let lapMeters = state.lapMeters + step;
  let lapStartedAt = state.lapStartedAt ?? fix.t;
  const splits = [...state.splits];

  // Complete as many laps as the step covers (handles long gaps).
  while (lapMeters >= lapLength) {
    const lapSeconds = Math.max(1, Math.round((fix.t - lapStartedAt) / 1000));
    splits.push({
      index: splits.length + 1,
      distance: 1,
      distanceUnit: unit,
      durationSeconds: lapSeconds,
    });
    lapMeters -= lapLength;
    lapStartedAt = fix.t;
  }

  return {
    distanceMeters: state.distanceMeters + step,
    points: [...state.points, point],
    splits,
    lapMeters,
    lapStartedAt,
    lastFix: fix,
  };
}

/** Final partial lap (> ~40m) appended when the run ends. */
export function finalizeSplits(state: TrackState, endedAt: number, unit: DistanceUnit): RunSplit[] {
  const lapLength = lapLengthMeters(unit);
  if (state.lapMeters < 40 || state.lapStartedAt === null) return state.splits;

  return [
    ...state.splits,
    {
      index: state.splits.length + 1,
      distance: Math.round((state.lapMeters / lapLength) * 100) / 100,
      distanceUnit: unit,
      durationSeconds: Math.max(1, Math.round((endedAt - state.lapStartedAt) / 1000)),
    },
  ];
}

export function metersToDistance(meters: number, unit: DistanceUnit): number {
  const value = meters / lapLengthMeters(unit);
  return Math.round(value * 100) / 100;
}

/** Rolling pace (sec per unit) over roughly the last windowSeconds of points. */
export function currentPaceSecondsPerUnit(
  points: RoutePoint[],
  unit: DistanceUnit,
  windowSeconds = 60
): number | undefined {
  if (points.length < 2) return undefined;

  const end = points[points.length - 1];
  const cutoff = end.t - windowSeconds * 1000;
  let startIndex = points.length - 2;
  while (startIndex > 0 && points[startIndex].t > cutoff) startIndex -= 1;

  let meters = 0;
  for (let i = startIndex; i < points.length - 1; i += 1) {
    meters += haversineMeters(points[i], points[i + 1]);
  }

  const seconds = (end.t - points[startIndex].t) / 1000;
  if (meters < 15 || seconds <= 0) return undefined;

  return Math.round((seconds / meters) * lapLengthMeters(unit));
}

/** Thin the stored route so long runs don't bloat AsyncStorage. */
export function compressRoute(points: RoutePoint[], maxPoints = 600): RoutePoint[] {
  if (points.length <= maxPoints) return points;
  const step = points.length / maxPoints;
  const out: RoutePoint[] = [];
  for (let i = 0; i < maxPoints; i += 1) {
    out.push(points[Math.floor(i * step)]);
  }
  out[out.length - 1] = points[points.length - 1];
  return out;
}
