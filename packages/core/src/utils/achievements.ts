import type { HybridSession, Run, Workout } from '../types';
import { getWorkoutVolume } from './progress';
import { getWeekRange, getWeeklySummary } from './weeklySummary';
import { runDistanceInMiles } from './weeklySummary';

/**
 * Streaks and milestone achievements, derived from saved training data.
 * Pure and Node-testable.
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Ionicons name
  earned: boolean;
  /** 0..1 toward the threshold (1 when earned). */
  progress: number;
}

/** Consecutive calendar weeks (including this or last week) with ≥1 session. */
export function getWeeklyStreak(
  workouts: Workout[],
  runs: Run[],
  hybridSessions: HybridSession[],
  now = new Date()
): number {
  let streak = 0;
  let offset = 0;

  // The current week counts if it has a session; otherwise the streak may
  // still be alive from last week.
  const thisWeek = getWeeklySummary(workouts, runs, hybridSessions, getWeekRange(now, 0));
  if (thisWeek.sessions > 0) {
    streak = 1;
    offset = -1;
  } else {
    offset = -1;
    const lastWeek = getWeeklySummary(workouts, runs, hybridSessions, getWeekRange(now, -1));
    if (lastWeek.sessions === 0) return 0;
  }

  // Walk backwards until an empty week (bounded for safety).
  for (let i = 0; i < 520; i += 1) {
    const summary = getWeeklySummary(
      workouts,
      runs,
      hybridSessions,
      getWeekRange(now, offset - i)
    );
    if (summary.sessions === 0) break;
    streak += 1;
  }

  return streak;
}

interface Threshold {
  value: number;
  title: string;
}

function tieredAchievements(
  idPrefix: string,
  icon: string,
  current: number,
  unitLabel: string,
  tiers: Threshold[]
): Achievement[] {
  return tiers.map((tier) => ({
    id: `${idPrefix}_${tier.value}`,
    title: tier.title,
    description: `${unitLabel.replace('{n}', String(tier.value))}`,
    icon,
    earned: current >= tier.value,
    progress: Math.min(1, current / tier.value),
  }));
}

export function getAchievements(
  workouts: Workout[],
  runs: Run[],
  hybridSessions: HybridSession[],
  now = new Date()
): { achievements: Achievement[]; weeklyStreak: number; earnedCount: number } {
  const totalSessions = workouts.length + runs.length + hybridSessions.length;
  const totalMiles = runs.reduce((sum, run) => sum + runDistanceInMiles(run), 0);
  const totalVolume = workouts.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);
  const weeklyStreak = getWeeklyStreak(workouts, runs, hybridSessions, now);

  const achievements: Achievement[] = [
    ...tieredAchievements('sessions', 'flame-outline', totalSessions, '{n} total sessions', [
      { value: 1, title: 'First Rep' },
      { value: 10, title: 'Ten Strong' },
      { value: 25, title: 'Quarter Century' },
      { value: 50, title: 'Fifty Club' },
      { value: 100, title: 'Century' },
      { value: 250, title: 'Machine' },
    ]),
    ...tieredAchievements('miles', 'walk-outline', totalMiles, '{n} miles run', [
      { value: 5, title: 'First Miles' },
      { value: 25, title: 'Road Warrior' },
      { value: 100, title: 'Century Runner' },
      { value: 500, title: 'Ultra Mind' },
    ]),
    ...tieredAchievements('volume', 'barbell-outline', totalVolume, '{n} total volume', [
      { value: 10_000, title: 'Ten Tons-ish' },
      { value: 100_000, title: 'Heavy Hitter' },
      { value: 1_000_000, title: 'Million Mover' },
    ]),
    ...tieredAchievements('streak', 'calendar-outline', weeklyStreak, '{n}-week streak', [
      { value: 2, title: 'Back to Back' },
      { value: 4, title: 'Habit Formed' },
      { value: 8, title: 'Two Months Deep' },
      { value: 12, title: 'Quarter Committed' },
    ]),
  ];

  return {
    achievements,
    weeklyStreak,
    earnedCount: achievements.filter((achievement) => achievement.earned).length,
  };
}
