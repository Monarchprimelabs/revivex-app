import type { Workout, WorkoutSet } from '../types';

/**
 * "Last time" lookup for the active workout: the most recent saved session's
 * sets for a given exercise. Pure and Node-testable.
 */

export interface LastPerformance {
  date: string;
  workoutId: string;
  sets: { weight: number; reps: number }[];
}

function usableSets(sets: WorkoutSet[]): WorkoutSet[] {
  const completed = sets.filter((set) => set.completed !== false);
  const pool = completed.length > 0 ? completed : sets;
  return pool.filter(
    (set) =>
      (Number.isFinite(set.weight) && set.weight > 0) ||
      (Number.isFinite(set.reps) && set.reps > 0)
  );
}

export function getLastPerformance(
  history: Workout[],
  exerciseKey: string
): LastPerformance | undefined {
  const ordered = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const workout of ordered) {
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    const matches = exercises.filter(
      (exercise) => (exercise.exerciseId || exercise.exerciseName) === exerciseKey
    );
    if (matches.length === 0) continue;

    const sets = matches.flatMap((exercise) => usableSets(exercise.sets));
    if (sets.length === 0) continue;

    return {
      date: workout.date,
      workoutId: workout.id,
      sets: sets.map((set) => ({
        weight: Math.max(0, Number.isFinite(set.weight) ? set.weight : 0),
        reps: Math.max(0, Math.floor(Number.isFinite(set.reps) ? set.reps : 0)),
      })),
    };
  }

  return undefined;
}

/** "185×8, 185×8, 205×5" (collapses long lists to the first 5 + count). */
export function formatLastPerformance(performance: LastPerformance): string {
  const parts = performance.sets.map((set) =>
    set.weight > 0 ? `${set.weight}×${set.reps}` : `${set.reps} reps`
  );
  if (parts.length <= 5) return parts.join(', ');
  return `${parts.slice(0, 5).join(', ')} +${parts.length - 5} more`;
}
