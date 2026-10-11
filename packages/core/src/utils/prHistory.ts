import type { MuscleGroup, Workout, WorkoutSet } from '../types';

/**
 * PR History v1
 * Derives per-exercise personal records and a PR timeline from saved
 * workout history. Only completed sets with weight and reps count.
 */

export interface PRSetRecord {
  weight: number;
  reps: number;
  est1RM: number;
  date: string;
  workoutId: string;
  workoutTitle: string;
}

export type PRKind = 'weight' | 'est1RM';

export interface PREvent extends PRSetRecord {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  kind: PRKind;
  previousWeight?: number;
  previousEst1RM?: number;
}

export interface ExercisePRSummary {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  bestWeight: PRSetRecord;
  bestEst1RM: PRSetRecord;
  prCount: number;
  lastPRDate: string;
}

function safeNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

/** Epley estimated one-rep max. Returns the weight itself for single reps. */
export function estimateOneRepMax(weight: number, reps: number): number {
  const safeWeight = Math.max(0, safeNumber(weight));
  const safeReps = Math.max(0, Math.floor(safeNumber(reps)));
  if (safeWeight <= 0 || safeReps <= 0) return 0;
  if (safeReps === 1) return safeWeight;
  return safeWeight * (1 + safeReps / 30);
}

function isCountableSet(set: WorkoutSet): boolean {
  if (set.completed === false) return false;
  return safeNumber(set.weight) > 0 && Math.floor(safeNumber(set.reps)) > 0;
}

function toRecord(set: WorkoutSet, workout: Workout): PRSetRecord {
  const weight = Math.max(0, safeNumber(set.weight));
  const reps = Math.max(0, Math.floor(safeNumber(set.reps)));
  return {
    weight,
    reps,
    est1RM: estimateOneRepMax(weight, reps),
    date: workout.date,
    workoutId: workout.id,
    workoutTitle: workout.title,
  };
}

interface RunningRecord {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  bestWeight: PRSetRecord;
  bestEst1RM: PRSetRecord;
  prCount: number;
  lastPRDate: string;
}

interface PRHistoryResult {
  summaries: ExercisePRSummary[];
  events: PREvent[];
}

/**
 * Walk workout history oldest-first, tracking each exercise's best weight
 * and best estimated 1RM. Emits at most one PR event per exercise per
 * workout (the best improvement from that session).
 */
export function getPRHistory(workouts: Workout[]): PRHistoryResult {
  const ordered = [...workouts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const records = new Map<string, RunningRecord>();
  const events: PREvent[] = [];

  for (const workout of ordered) {
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];

    for (const exercise of exercises) {
      const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
      const countable = sets.filter(isCountableSet);
      if (countable.length === 0) continue;

      // Best set of this session by weight, then reps.
      const bestWeightSet = countable.reduce((best, set) =>
        safeNumber(set.weight) > safeNumber(best.weight) ||
        (safeNumber(set.weight) === safeNumber(best.weight) &&
          safeNumber(set.reps) > safeNumber(best.reps))
          ? set
          : best
      );
      // Best set of this session by estimated 1RM.
      const bestEst1RMSet = countable.reduce((best, set) =>
        estimateOneRepMax(safeNumber(set.weight), safeNumber(set.reps)) >
        estimateOneRepMax(safeNumber(best.weight), safeNumber(best.reps))
          ? set
          : best
      );

      const key = exercise.exerciseId || exercise.exerciseName;
      const weightRecord = toRecord(bestWeightSet, workout);
      const est1RMRecord = toRecord(bestEst1RMSet, workout);
      const existing = records.get(key);

      if (!existing) {
        records.set(key, {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup,
          bestWeight: weightRecord,
          bestEst1RM: est1RMRecord,
          prCount: 1,
          lastPRDate: workout.date,
        });
        events.push({
          ...weightRecord,
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup,
          kind: 'weight',
        });
        continue;
      }

      const beatWeight =
        weightRecord.weight > existing.bestWeight.weight ||
        (weightRecord.weight === existing.bestWeight.weight &&
          weightRecord.reps > existing.bestWeight.reps);
      const beatEst1RM = est1RMRecord.est1RM > existing.bestEst1RM.est1RM;

      if (beatWeight || beatEst1RM) {
        const record = beatWeight ? weightRecord : est1RMRecord;
        events.push({
          ...record,
          exerciseId: existing.exerciseId,
          exerciseName: existing.exerciseName,
          muscleGroup: existing.muscleGroup,
          kind: beatWeight ? 'weight' : 'est1RM',
          previousWeight: existing.bestWeight.weight,
          previousEst1RM: existing.bestEst1RM.est1RM,
        });
        existing.prCount += 1;
        existing.lastPRDate = workout.date;
      }

      if (beatWeight) existing.bestWeight = weightRecord;
      if (beatEst1RM) existing.bestEst1RM = est1RMRecord;
    }
  }

  const summaries = Array.from(records.values())
    .map((record) => ({
      exerciseId: record.exerciseId,
      exerciseName: record.exerciseName,
      muscleGroup: record.muscleGroup,
      bestWeight: record.bestWeight,
      bestEst1RM: record.bestEst1RM,
      prCount: record.prCount,
      lastPRDate: record.lastPRDate,
    }))
    .sort(
      (a, b) =>
        b.bestWeight.weight - a.bestWeight.weight ||
        b.bestWeight.reps - a.bestWeight.reps ||
        b.bestEst1RM.est1RM - a.bestEst1RM.est1RM
    );

  // Newest first for display.
  events.reverse();

  return { summaries, events };
}

export function formatPRWeight(weight: number, unit: string): string {
  const rounded = Number.isInteger(weight) ? weight.toFixed(0) : weight.toFixed(1);
  return `${rounded} ${unit}`;
}

export function formatEst1RM(est1RM: number, unit: string): string {
  return `${Math.round(est1RM)} ${unit}`;
}
