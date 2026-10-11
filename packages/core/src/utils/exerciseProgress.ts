import type { MuscleGroup, Workout, WorkoutSet } from '../types';
import { estimateOneRepMax } from './prHistory';

/**
 * Exercise Progress Detail v1
 * Session-by-session history for a single exercise, derived from saved
 * workout history. Only completed sets with weight and reps count toward
 * best set and volume; sets are still counted for the session set total.
 */

export interface ExerciseSession {
  workoutId: string;
  workoutTitle: string;
  date: string;
  bestWeight: number;
  bestReps: number;
  bestEst1RM: number;
  sessionVolume: number;
  totalSets: number;
  completedSets: number;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sessions: ExerciseSession[]; // newest first
  bestWeight: number;
  bestEst1RM: number;
  totalVolume: number;
  totalSessions: number;
}

function safeNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isCountableSet(set: WorkoutSet): boolean {
  if (set.completed === false) return false;
  return safeNumber(set.weight) > 0 && Math.floor(safeNumber(set.reps)) > 0;
}

export function exerciseKeyOf(exerciseId: string | undefined, exerciseName: string): string {
  return exerciseId || exerciseName;
}

export function getExerciseProgress(
  workouts: Workout[],
  exerciseKey: string
): ExerciseProgress | undefined {
  const sessions: ExerciseSession[] = [];
  let exerciseId = '';
  let exerciseName = '';
  let muscleGroup: MuscleGroup | undefined;

  for (const workout of workouts) {
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    const matches = exercises.filter(
      (exercise) => exerciseKeyOf(exercise.exerciseId, exercise.exerciseName) === exerciseKey
    );
    if (matches.length === 0) continue;

    exerciseId = matches[0].exerciseId;
    exerciseName = matches[0].exerciseName;
    muscleGroup = matches[0].muscleGroup;

    let bestWeight = 0;
    let bestReps = 0;
    let bestEst1RM = 0;
    let sessionVolume = 0;
    let totalSets = 0;
    let completedSets = 0;

    for (const exercise of matches) {
      const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
      totalSets += sets.length;

      for (const set of sets) {
        if (!isCountableSet(set)) continue;

        const weight = Math.max(0, safeNumber(set.weight));
        const reps = Math.max(0, Math.floor(safeNumber(set.reps)));
        completedSets += 1;
        sessionVolume += weight * reps;

        if (weight > bestWeight || (weight === bestWeight && reps > bestReps)) {
          bestWeight = weight;
          bestReps = reps;
        }

        const est1RM = estimateOneRepMax(weight, reps);
        if (est1RM > bestEst1RM) bestEst1RM = est1RM;
      }
    }

    sessions.push({
      workoutId: workout.id,
      workoutTitle: workout.title,
      date: workout.date,
      bestWeight,
      bestReps,
      bestEst1RM,
      sessionVolume,
      totalSets,
      completedSets,
    });
  }

  if (sessions.length === 0 || !muscleGroup) return undefined;

  sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    exerciseId,
    exerciseName,
    muscleGroup,
    sessions,
    bestWeight: Math.max(...sessions.map((session) => session.bestWeight), 0),
    bestEst1RM: Math.max(...sessions.map((session) => session.bestEst1RM), 0),
    totalVolume: sessions.reduce((sum, session) => sum + session.sessionVolume, 0),
    totalSessions: sessions.length,
  };
}
