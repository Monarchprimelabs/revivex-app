import type { MuscleGroup, Run, Workout } from '@revivex/core';
import type { SlotKind } from './types';

export const SLOT_MUSCLE_GROUPS: Record<Exclude<SlotKind, 'run_easy' | 'run_quality' | 'run_long' | 'hybrid'>, MuscleGroup[]> = {
  upper: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
  lower: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  push: ['Chest', 'Shoulders', 'Triceps', 'Chest'],
  pull: ['Back', 'Biceps', 'Back', 'Shoulders'],
  full: ['Quads', 'Chest', 'Back', 'Shoulders', 'Core'],
};

export const HARD_RUN_TYPES = new Set(['Tempo', 'Intervals', 'Long Run', 'Race']);
export const FATIGUE_WINDOW_HOURS = 48;
/** Sets on a slot's muscle groups inside the window that count as "still recovering". */
export const FATIGUE_SET_THRESHOLD = 6;

export function isStrengthSlot(slot: SlotKind): slot is keyof typeof SLOT_MUSCLE_GROUPS {
  return slot in SLOT_MUSCLE_GROUPS;
}

export function setsByMuscleGroupSince(workouts: Workout[], since: Date, until: Date): Partial<Record<MuscleGroup, number>> {
  const totals: Partial<Record<MuscleGroup, number>> = {};
  for (const workout of workouts) {
    const t = new Date(workout.date).getTime();
    if (!Number.isFinite(t) || t < since.getTime() || t > until.getTime()) continue;
    for (const exercise of workout.exercises ?? []) {
      const completed = exercise.sets.filter((set) => set.completed !== false).length;
      totals[exercise.muscleGroup] = (totals[exercise.muscleGroup] ?? 0) + completed;
    }
  }
  return totals;
}

export interface FatigueCheck {
  fatigued: boolean;
  sets: number;
  hoursSince?: number;
}

export function strengthSlotFatigue(slot: SlotKind, workouts: Workout[], now: Date): FatigueCheck {
  if (!isStrengthSlot(slot)) return { fatigued: false, sets: 0 };
  const since = new Date(now.getTime() - FATIGUE_WINDOW_HOURS * 3600 * 1000);
  const totals = setsByMuscleGroupSince(workouts, since, now);
  const groups = new Set(SLOT_MUSCLE_GROUPS[slot]);
  let sets = 0;
  for (const group of groups) sets += totals[group] ?? 0;
  let hoursSince: number | undefined;
  for (const workout of workouts) {
    const t = new Date(workout.date).getTime();
    if (t < since.getTime() || t > now.getTime()) continue;
    if (!workout.exercises.some((exercise) => groups.has(exercise.muscleGroup))) continue;
    const hours = Math.round((now.getTime() - t) / 3600000);
    hoursSince = hoursSince === undefined ? hours : Math.min(hoursSince, hours);
  }
  return { fatigued: sets >= FATIGUE_SET_THRESHOLD, sets, hoursSince };
}

export function hardRunWithin(runs: Run[], now: Date, hours = FATIGUE_WINDOW_HOURS): Run | undefined {
  const since = now.getTime() - hours * 3600 * 1000;
  return runs
    .filter((run) => {
      const t = new Date(run.date).getTime();
      return t >= since && t <= now.getTime() && HARD_RUN_TYPES.has(run.runType);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}
