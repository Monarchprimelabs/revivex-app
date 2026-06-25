import type { MuscleGroup, Workout, WorkoutExercise, WorkoutSet } from '../types';

export const STRENGTH_MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
];

export interface WeeklyActivityDay {
  dateKey: string;
  dayLabel: string;
  workoutCount: number;
  totalSets: number;
  totalVolume: number;
}

export interface MuscleGroupStat {
  muscleGroup: MuscleGroup;
  totalSets: number;
  totalVolume: number;
}

export interface ExercisePR {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  weight: number;
  reps: number;
  volume: number;
  date: string;
}

export interface WorkoutVolumeResult {
  workout: Workout;
  totalVolume: number;
  totalSets: number;
}

export interface FrequentExerciseResult {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  appearances: number;
  totalSets: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function safeNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(safeNumber(value)));
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

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSets(exercise: WorkoutExercise): WorkoutSet[] {
  return Array.isArray(exercise.sets) ? exercise.sets : [];
}

function getWorkoutExercises(workout: Workout): WorkoutExercise[] {
  return Array.isArray(workout.exercises) ? workout.exercises : [];
}

function isCompletedSet(set: WorkoutSet): boolean {
  return set.completed !== false;
}

function getSetVolume(set: WorkoutSet): number {
  if (!isCompletedSet(set)) return 0;

  const weight = Math.max(0, safeNumber(set.weight));
  const reps = safeInteger(set.reps);
  if (weight <= 0 || reps <= 0) return 0;

  return weight * reps;
}

export function getWorkoutTotalSets(workout: Workout): number {
  const countedSets = getWorkoutExercises(workout).reduce(
    (sum, exercise) => sum + getSets(exercise).length,
    0
  );

  if (countedSets > 0) return countedSets;
  return safeInteger(workout.totalSets);
}

export function getWorkoutVolume(workout: Workout): number {
  const countedVolume = getWorkoutExercises(workout).reduce(
    (workoutTotal, exercise) =>
      workoutTotal + getSets(exercise).reduce((sum, set) => sum + getSetVolume(set), 0),
    0
  );

  if (countedVolume > 0) return countedVolume;
  return Math.max(0, safeNumber(workout.totalVolume));
}

export function getTotalWorkouts(workouts: Workout[]): number {
  return workouts.length;
}

export function getTotalSets(workouts: Workout[]): number {
  return workouts.reduce((sum, workout) => sum + getWorkoutTotalSets(workout), 0);
}

export function getTotalVolume(workouts: Workout[]): number {
  return workouts.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);
}

export function getWorkoutsThisWeek(workouts: Workout[], now = new Date()): number {
  const start = startOfDay(now);
  start.setDate(start.getDate() - start.getDay());
  const end = endOfDay(now);

  return workouts.filter((workout) => {
    const date = safeDate(workout.date);
    return date ? date >= start && date <= end : false;
  }).length;
}

export function getAverageWorkoutVolume(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  return getTotalVolume(workouts) / workouts.length;
}

export function getWeeklyActivity(workouts: Workout[], now = new Date()): WeeklyActivityDay[] {
  const today = startOfDay(now);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * DAY_MS);
    const key = dateKey(date);
    const dayWorkouts = workouts.filter((workout) => {
      const workoutDate = safeDate(workout.date);
      return workoutDate ? dateKey(workoutDate) === key : false;
    });

    return {
      dateKey: key,
      dayLabel: date.toLocaleDateString(undefined, { weekday: 'short' }),
      workoutCount: dayWorkouts.length,
      totalSets: getTotalSets(dayWorkouts),
      totalVolume: getTotalVolume(dayWorkouts),
    };
  });
}

export function getMuscleGroupStats(workouts: Workout[]): MuscleGroupStat[] {
  const stats = new Map<MuscleGroup, MuscleGroupStat>();

  const ensureStat = (muscleGroup: MuscleGroup) => {
    const existing = stats.get(muscleGroup);
    if (existing) return existing;

    const next: MuscleGroupStat = {
      muscleGroup,
      totalSets: 0,
      totalVolume: 0,
    };
    stats.set(muscleGroup, next);
    return next;
  };

  STRENGTH_MUSCLE_GROUPS.forEach(ensureStat);

  for (const workout of workouts) {
    for (const exercise of getWorkoutExercises(workout)) {
      const stat = ensureStat(exercise.muscleGroup);
      const sets = getSets(exercise);
      stat.totalSets += sets.length;
      stat.totalVolume += sets.reduce((sum, set) => sum + getSetVolume(set), 0);
    }
  }

  const orderedStrengthGroups = STRENGTH_MUSCLE_GROUPS.map((group) => ensureStat(group));
  const extraGroups = Array.from(stats.values()).filter(
    (stat) => !STRENGTH_MUSCLE_GROUPS.includes(stat.muscleGroup) && stat.totalSets > 0
  );

  return [...orderedStrengthGroups, ...extraGroups];
}

export function getMostTrainedMuscleGroup(workouts: Workout[]): MuscleGroupStat | undefined {
  return getMuscleGroupStats(workouts)
    .filter((stat) => stat.totalSets > 0)
    .sort((a, b) => b.totalSets - a.totalSets || b.totalVolume - a.totalVolume)[0];
}

export function getBestVolumeWorkout(workouts: Workout[]): WorkoutVolumeResult | undefined {
  return workouts
    .map((workout) => ({
      workout,
      totalVolume: getWorkoutVolume(workout),
      totalSets: getWorkoutTotalSets(workout),
    }))
    .filter((result) => result.totalVolume > 0 || result.totalSets > 0)
    .sort((a, b) => b.totalVolume - a.totalVolume || b.totalSets - a.totalSets)[0];
}

export function getMostFrequentExercise(workouts: Workout[]): FrequentExerciseResult | undefined {
  const exerciseMap = new Map<string, FrequentExerciseResult>();

  for (const workout of workouts) {
    for (const exercise of getWorkoutExercises(workout)) {
      const key = exercise.exerciseId || exercise.exerciseName;
      const existing = exerciseMap.get(key);
      const sets = getSets(exercise).length;

      if (existing) {
        existing.appearances += 1;
        existing.totalSets += sets;
      } else {
        exerciseMap.set(key, {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup,
          appearances: 1,
          totalSets: sets,
        });
      }
    }
  }

  return Array.from(exerciseMap.values()).sort(
    (a, b) => b.appearances - a.appearances || b.totalSets - a.totalSets
  )[0];
}

export function getTopExercisePRs(workouts: Workout[], limit = 5): ExercisePR[] {
  const prMap = new Map<string, ExercisePR>();

  for (const workout of workouts) {
    for (const exercise of getWorkoutExercises(workout)) {
      const key = exercise.exerciseId || exercise.exerciseName;

      for (const set of getSets(exercise)) {
        if (!isCompletedSet(set)) continue;

        const weight = Math.max(0, safeNumber(set.weight));
        const reps = safeInteger(set.reps);
        if (weight <= 0 || reps <= 0) continue;

        const candidate: ExercisePR = {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup,
          weight,
          reps,
          volume: weight * reps,
          date: workout.date,
        };

        const existing = prMap.get(key);
        if (
          !existing ||
          candidate.weight > existing.weight ||
          (candidate.weight === existing.weight && candidate.reps > existing.reps) ||
          (candidate.weight === existing.weight &&
            candidate.reps === existing.reps &&
            candidate.date > existing.date)
        ) {
          prMap.set(key, candidate);
        }
      }
    }
  }

  return Array.from(prMap.values())
    .sort((a, b) => b.weight - a.weight || b.reps - a.reps || b.volume - a.volume)
    .slice(0, limit);
}

export function getCurrentTrainingStreak(workouts: Workout[], now = new Date()): number {
  const workoutDays = new Set(
    workouts
      .map((workout) => safeDate(workout.date))
      .filter((date): date is Date => date !== null)
      .map(dateKey)
  );

  if (workoutDays.size === 0) return 0;

  let cursor = startOfDay(now);
  if (!workoutDays.has(dateKey(cursor))) {
    const yesterday = new Date(cursor.getTime() - DAY_MS);
    if (!workoutDays.has(dateKey(yesterday))) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  while (workoutDays.has(dateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return streak;
}
