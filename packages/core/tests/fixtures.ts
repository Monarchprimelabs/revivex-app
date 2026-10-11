import type { Run, Workout, WorkoutExercise, WorkoutSet } from '../src/types';

/** Build a completed set. */
export function set(weight: number, reps: number, completed = true): WorkoutSet {
  return {
    id: `set_${Math.random().toString(36).slice(2, 8)}`,
    setNumber: 1,
    weight,
    reps,
    completed,
  } as WorkoutSet;
}

export function exercise(
  exerciseId: string,
  exerciseName: string,
  sets: WorkoutSet[],
  restSeconds?: number
): WorkoutExercise {
  return {
    id: `wex_${exerciseId}`,
    exerciseId,
    exerciseName,
    muscleGroup: 'Chest',
    sets,
    restSeconds,
  } as WorkoutExercise;
}

export function workout(
  id: string,
  dateIso: string,
  exercises: WorkoutExercise[],
  title = 'Test Workout'
): Workout {
  const allSets = exercises.flatMap((ex) => ex.sets);
  return {
    id,
    title,
    date: dateIso,
    duration: 3600,
    exercises,
    totalSets: allSets.length,
    totalVolume: allSets
      .filter((s) => s.completed !== false)
      .reduce((sum, s) => sum + s.weight * s.reps, 0),
  } as Workout;
}

export function run(id: string, dateIso: string, distance: number, unit: 'mi' | 'km'): Run {
  return {
    id,
    title: 'Test Run',
    date: dateIso,
    distance,
    distanceUnit: unit,
    durationSeconds: 1800,
    runType: 'Outdoor',
    createdAt: dateIso,
  } as Run;
}
