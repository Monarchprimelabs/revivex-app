import type { HybridSession, PreferredDistanceUnit, Run, Workout } from '../types';
import { getWorkoutVolume } from './progress';

/**
 * Weekly Training Summary
 * Combines strength, running, and hybrid activity into one calendar-week
 * snapshot (weeks start Sunday, matching getWorkoutsThisWeek). Pure and
 * Node-testable.
 */

export interface WeeklySummary {
  /** All training sessions combined (workouts + runs + hybrid). */
  sessions: number;
  strengthWorkouts: number;
  runs: number;
  hybridSessions: number;
  strengthVolume: number;
  runDistanceMiles: number;
  hybridSeconds: number;
  /** Distinct calendar days with at least one session. */
  activeDays: number;
}

export interface WeekRange {
  start: Date;
  end: Date;
}

/** Calendar week containing `now`, shifted by offsetWeeks (-1 = last week). */
export function getWeekRange(now = new Date(), offsetWeeks = 0): WeekRange {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay() + offsetWeeks * 7);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setMilliseconds(-1);

  return { start, end };
}

function inRange(iso: string, range: WeekRange): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date >= range.start && date <= range.end;
}

function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function runDistanceInMiles(run: Run): number {
  const distance = Number.isFinite(run.distance) ? Math.max(0, run.distance) : 0;
  return run.distanceUnit === 'km' ? distance * 0.621371 : distance;
}

export function milesToPreferredUnit(miles: number, unit: PreferredDistanceUnit): number {
  const safe = Number.isFinite(miles) ? Math.max(0, miles) : 0;
  const converted = unit === 'km' ? safe / 0.621371 : safe;
  return Math.round(converted * 10) / 10;
}

export function getWeeklySummary(
  workouts: Workout[],
  runs: Run[],
  hybridSessions: HybridSession[],
  range: WeekRange
): WeeklySummary {
  const weekWorkouts = workouts.filter((workout) => inRange(workout.date, range));
  const weekRuns = runs.filter((run) => inRange(run.date, range));
  const weekHybrid = hybridSessions.filter((session) => inRange(session.date, range));

  const days = new Set<string>([
    ...weekWorkouts.map((workout) => dayKey(workout.date)),
    ...weekRuns.map((run) => dayKey(run.date)),
    ...weekHybrid.map((session) => dayKey(session.date)),
  ]);

  return {
    sessions: weekWorkouts.length + weekRuns.length + weekHybrid.length,
    strengthWorkouts: weekWorkouts.length,
    runs: weekRuns.length,
    hybridSessions: weekHybrid.length,
    strengthVolume: weekWorkouts.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0),
    runDistanceMiles: weekRuns.reduce((sum, run) => sum + runDistanceInMiles(run), 0),
    hybridSeconds: weekHybrid.reduce(
      (sum, session) =>
        sum +
        (Number.isFinite(session.totalDurationSeconds)
          ? Math.max(0, session.totalDurationSeconds)
          : 0),
      0
    ),
    activeDays: days.size,
  };
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface WeeklyDelta {
  direction: TrendDirection;
  /** Percent change vs last week, rounded; undefined when last week was 0. */
  percent?: number;
}

export function getWeeklyDelta(current: number, previous: number): WeeklyDelta {
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safePrevious = Number.isFinite(previous) ? previous : 0;

  if (safeCurrent === safePrevious) return { direction: 'flat' };
  const direction: TrendDirection = safeCurrent > safePrevious ? 'up' : 'down';
  if (safePrevious === 0) return { direction };

  return {
    direction,
    percent: Math.round(Math.abs((safeCurrent - safePrevious) / safePrevious) * 100),
  };
}
