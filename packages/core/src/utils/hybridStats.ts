import type { HybridSegment, HybridSession } from '../types';
import { formatDuration } from './format';

export interface HybridStats {
  totalSessions: number;
  bestSession?: HybridSession;
  latestSession?: HybridSession;
  averageSessionTime: number;
  slowestSegment?: HybridSegment & { sessionTitle: string; sessionDate: string };
  fastestSegment?: HybridSegment & { sessionTitle: string; sessionDate: string };
  runTotalTime: number;
  stationTotalTime: number;
  totalTimedSegments: number;
}

function safeNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function safeDateValue(iso: string): number {
  const date = new Date(iso).getTime();
  return Number.isFinite(date) ? date : 0;
}

function sortNewestFirst(sessions: HybridSession[]): HybridSession[] {
  return [...sessions].sort((a, b) => safeDateValue(b.date) - safeDateValue(a.date));
}

export function formatSegmentTime(totalSeconds: number): string {
  return formatDuration(totalSeconds);
}

export function formatHybridDistance(
  distance?: number,
  unit?: HybridSegment['distanceUnit']
): string {
  const safeDistance = Math.max(0, safeNumber(distance));
  if (!unit || safeDistance <= 0) return '—';

  if (unit === 'm') {
    return `${Math.round(safeDistance).toLocaleString()} m`;
  }

  const rounded = safeDistance >= 10 ? safeDistance.toFixed(1) : safeDistance.toFixed(2);
  return `${rounded.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} ${unit}`;
}

export function calculateHybridTotalTime(segments: HybridSegment[]): number {
  return segments.reduce(
    (sum, segment) => sum + Math.max(0, Math.floor(safeNumber(segment.durationSeconds))),
    0
  );
}

export function getRecentHybridSessions(sessions: HybridSession[], limit = 3): HybridSession[] {
  return sortNewestFirst(sessions).slice(0, limit);
}

export function getBestHybridTime(sessions: HybridSession[]): HybridSession | undefined {
  return [...sessions]
    .filter((session) => safeNumber(session.totalDurationSeconds) > 0)
    .sort((a, b) => safeNumber(a.totalDurationSeconds) - safeNumber(b.totalDurationSeconds))[0];
}

export function getAverageHybridTime(sessions: HybridSession[]): number {
  const timedSessions = sessions.filter((session) => safeNumber(session.totalDurationSeconds) > 0);
  if (timedSessions.length === 0) return 0;

  const totalTime = timedSessions.reduce(
    (sum, session) => sum + Math.max(0, safeNumber(session.totalDurationSeconds)),
    0
  );

  return totalTime / timedSessions.length;
}

export function getRunVsStationTime(sessions: HybridSession[]) {
  return sessions.reduce(
    (totals, session) => {
      for (const segment of session.segments) {
        const duration = Math.max(0, safeNumber(segment.durationSeconds));
        if (segment.segmentType === 'run') {
          totals.runTotalTime += duration;
        } else {
          totals.stationTotalTime += duration;
        }
      }
      return totals;
    },
    { runTotalTime: 0, stationTotalTime: 0 }
  );
}

export function getSlowestSegment(sessions: HybridSession[]) {
  return sessions
    .flatMap((session) =>
      session.segments.map((segment) => ({
        ...segment,
        sessionTitle: session.title,
        sessionDate: session.date,
      }))
    )
    .filter((segment) => safeNumber(segment.durationSeconds) > 0)
    .sort((a, b) => safeNumber(b.durationSeconds) - safeNumber(a.durationSeconds))[0];
}

export function getFastestSegment(sessions: HybridSession[]) {
  return sessions
    .flatMap((session) =>
      session.segments.map((segment) => ({
        ...segment,
        sessionTitle: session.title,
        sessionDate: session.date,
      }))
    )
    .filter((segment) => safeNumber(segment.durationSeconds) > 0)
    .sort((a, b) => safeNumber(a.durationSeconds) - safeNumber(b.durationSeconds))[0];
}

export function getHybridSessionStats(sessions: HybridSession[]): HybridStats {
  const sortedSessions = sortNewestFirst(sessions);
  const { runTotalTime, stationTotalTime } = getRunVsStationTime(sessions);

  return {
    totalSessions: sessions.length,
    bestSession: getBestHybridTime(sessions),
    latestSession: sortedSessions[0],
    averageSessionTime: getAverageHybridTime(sessions),
    slowestSegment: getSlowestSegment(sessions),
    fastestSegment: getFastestSegment(sessions),
    runTotalTime,
    stationTotalTime,
    totalTimedSegments: sessions.reduce(
      (sum, session) =>
        sum + session.segments.filter((segment) => safeNumber(segment.durationSeconds) > 0).length,
      0
    ),
  };
}
