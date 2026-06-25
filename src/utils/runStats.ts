import type { DistanceUnit, Run } from '../types';
import { formatDuration } from './format';

const MILES_PER_KM = 0.621371;
const KM_PER_MILE = 1.609344;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface RunPRs {
  longestRun?: Run;
  bestPace?: Run;
  fastest5K?: Run;
}

export interface RunStats {
  totalRuns: number;
  totalDistanceMiles: number;
  totalDistanceKm: number;
  weeklyMileageMiles: number;
  weeklyMileageKm: number;
  runsThisWeek: number;
  averagePaceSecondsPerMile?: number;
  averagePaceSecondsPerKm?: number;
  longestRun?: Run;
  bestPace?: Run;
  fastest5K?: Run;
}

function safeNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function safeDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function convertDistance(
  distance: number,
  fromUnit: DistanceUnit,
  toUnit: DistanceUnit
): number {
  const safeDistance = Math.max(0, safeNumber(distance));
  if (fromUnit === toUnit) return safeDistance;
  return fromUnit === 'mi' ? safeDistance * KM_PER_MILE : safeDistance * MILES_PER_KM;
}

export function calculatePace(
  distance: number,
  unit: DistanceUnit,
  durationSeconds: number
): { paceSecondsPerMile?: number; paceSecondsPerKm?: number } {
  const safeDistance = Math.max(0, safeNumber(distance));
  const safeDuration = Math.max(0, Math.floor(safeNumber(durationSeconds)));

  if (safeDistance <= 0 || safeDuration <= 0) {
    return {};
  }

  const miles = convertDistance(safeDistance, unit, 'mi');
  const km = convertDistance(safeDistance, unit, 'km');

  return {
    paceSecondsPerMile: miles > 0 ? safeDuration / miles : undefined,
    paceSecondsPerKm: km > 0 ? safeDuration / km : undefined,
  };
}

export function formatRunDuration(totalSeconds: number): string {
  return formatDuration(totalSeconds);
}

export function formatPace(paceSeconds?: number): string {
  if (!paceSeconds || !Number.isFinite(paceSeconds) || paceSeconds <= 0) {
    return '—';
  }

  const rounded = Math.round(paceSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatDistance(distance: number, unit: DistanceUnit): string {
  const safeDistance = Math.max(0, safeNumber(distance));
  const rounded = safeDistance >= 10 ? safeDistance.toFixed(1) : safeDistance.toFixed(2);
  return `${rounded.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} ${unit}`;
}

export function getRunDistanceMiles(run: Run): number {
  return convertDistance(run.distance, run.distanceUnit, 'mi');
}

export function getRunDistanceKm(run: Run): number {
  return convertDistance(run.distance, run.distanceUnit, 'km');
}

export function getRunsThisWeek(runs: Run[], now = new Date()): number {
  const start = startOfDay(now);
  start.setDate(start.getDate() - start.getDay());
  const end = endOfDay(now);

  return runs.filter((run) => {
    const date = safeDate(run.date);
    return date ? date >= start && date <= end : false;
  }).length;
}

export function getWeeklyMileage(runs: Run[], unit: DistanceUnit = 'mi', now = new Date()): number {
  const start = startOfDay(now);
  start.setDate(start.getDate() - start.getDay());
  const end = endOfDay(now);

  return runs.reduce((sum, run) => {
    const date = safeDate(run.date);
    if (!date || date < start || date > end) return sum;
    return sum + convertDistance(run.distance, run.distanceUnit, unit);
  }, 0);
}

export function getRecentRuns(runs: Run[], limit = 3): Run[] {
  return [...runs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function getLongestRun(runs: Run[]): Run | undefined {
  return [...runs]
    .filter((run) => getRunDistanceMiles(run) > 0)
    .sort((a, b) => getRunDistanceMiles(b) - getRunDistanceMiles(a))[0];
}

export function getBestPace(runs: Run[]): Run | undefined {
  return [...runs]
    .filter((run) => (run.paceSecondsPerMile ?? 0) > 0)
    .sort((a, b) => (a.paceSecondsPerMile ?? Infinity) - (b.paceSecondsPerMile ?? Infinity))[0];
}

export function getFastest5K(runs: Run[]): Run | undefined {
  return [...runs]
    .filter((run) => getRunDistanceKm(run) >= 5 && (run.paceSecondsPerKm ?? 0) > 0)
    .sort((a, b) => (a.paceSecondsPerKm ?? Infinity) - (b.paceSecondsPerKm ?? Infinity))[0];
}

export function getRunPRs(runs: Run[]): RunPRs {
  return {
    longestRun: getLongestRun(runs),
    bestPace: getBestPace(runs),
    fastest5K: getFastest5K(runs),
  };
}

export function calculateRunStats(runs: Run[], now = new Date()): RunStats {
  const totalDistanceMiles = runs.reduce((sum, run) => sum + getRunDistanceMiles(run), 0);
  const totalDistanceKm = runs.reduce((sum, run) => sum + getRunDistanceKm(run), 0);
  const totalDuration = runs.reduce(
    (sum, run) => sum + Math.max(0, safeNumber(run.durationSeconds)),
    0
  );
  const prs = getRunPRs(runs);

  return {
    totalRuns: runs.length,
    totalDistanceMiles,
    totalDistanceKm,
    weeklyMileageMiles: getWeeklyMileage(runs, 'mi', now),
    weeklyMileageKm: getWeeklyMileage(runs, 'km', now),
    runsThisWeek: getRunsThisWeek(runs, now),
    averagePaceSecondsPerMile:
      totalDistanceMiles > 0 && totalDuration > 0 ? totalDuration / totalDistanceMiles : undefined,
    averagePaceSecondsPerKm:
      totalDistanceKm > 0 && totalDuration > 0 ? totalDuration / totalDistanceKm : undefined,
    longestRun: prs.longestRun,
    bestPace: prs.bestPace,
    fastest5K: prs.fastest5K,
  };
}
