import type { CreateRoutineInput, RoutineExercise, Workout, WorkoutSet } from '../types';

/**
 * Turn a completed workout into a routine template. Pure and Node-testable.
 *
 * Per exercise:
 *  - targetSets  = number of logged sets
 *  - targetReps  = most common rep count among completed sets (falls back to
 *                  all sets, then undefined)
 *  - targetWeight = heaviest weight among completed sets (same fallback)
 *  - restSeconds  = carried over when the workout tracked it
 */

function countableSets(sets: WorkoutSet[]): WorkoutSet[] {
  const completed = sets.filter((set) => set.completed !== false);
  return completed.length > 0 ? completed : sets;
}

function mostCommonReps(sets: WorkoutSet[]): number | undefined {
  const counts = new Map<number, number>();
  for (const set of sets) {
    const reps = Math.max(0, Math.floor(Number.isFinite(set.reps) ? set.reps : 0));
    if (reps <= 0) continue;
    counts.set(reps, (counts.get(reps) ?? 0) + 1);
  }
  let best: number | undefined;
  let bestCount = 0;
  for (const [reps, count] of counts) {
    if (count > bestCount || (count === bestCount && best !== undefined && reps > best)) {
      best = reps;
      bestCount = count;
    }
  }
  return best;
}

function heaviestWeight(sets: WorkoutSet[]): number | undefined {
  const weights = sets
    .map((set) => (Number.isFinite(set.weight) ? set.weight : 0))
    .filter((weight) => weight > 0);
  return weights.length > 0 ? Math.max(...weights) : undefined;
}

export function workoutToRoutineInput(workout: Workout): CreateRoutineInput {
  const exercises: RoutineExercise[] = workout.exercises
    .filter((exercise) => exercise.sets.length > 0)
    .map((exercise, index) => {
      const sets = countableSets(exercise.sets);
      return {
        id: `rtex_${index + 1}_${exercise.id}`,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        muscleGroup: exercise.muscleGroup,
        targetSets: exercise.sets.length,
        targetReps: mostCommonReps(sets),
        targetWeight: heaviestWeight(sets),
        restSeconds: exercise.restSeconds,
      };
    });

  return {
    name: workout.title.trim() || 'Saved Workout',
    description: `Saved from workout on ${new Date(workout.date).toLocaleDateString()}`,
    goal: 'Strength',
    exercises,
  };
}
