import type { MuscleGroup, PreferredWeightUnit, PrimaryGoal, Workout } from '@revivex/core';
import { exerciseLibrary, getLastPerformance } from '@revivex/core';
import { SLOT_MUSCLE_GROUPS } from './fatigue';
import type { CoachProfile, ReadinessAssessment, SlotKind, StrengthBlock } from './types';

/** Sensible first choice per muscle group when the user has no history for it. */
export const DEFAULT_EXERCISE_BY_GROUP: Partial<Record<MuscleGroup, string>> = {
  Chest: 'bench-press',
  Back: 'lat-pulldown',
  Shoulders: 'shoulder-press',
  Biceps: 'biceps-curl',
  Triceps: 'triceps-pushdown',
  Quads: 'barbell-back-squat',
  Hamstrings: 'romanian-deadlift',
  Glutes: 'hip-thrust',
  Calves: 'standing-calf-raise',
  Core: 'cable-crunch',
};

const LOWER_BODY: Set<MuscleGroup> = new Set(['Quads', 'Hamstrings', 'Glutes', 'Calves']);

interface Prescription {
  sets: number;
  reps: number;
  restSeconds: number;
}

export function prescriptionFor(goal: PrimaryGoal, experience: CoachProfile['experienceLevel'], isCompound: boolean): Prescription {
  let base: Prescription;
  switch (goal) {
    case 'Build Strength':
      base = isCompound ? { sets: 4, reps: 5, restSeconds: 180 } : { sets: 3, reps: 8, restSeconds: 90 };
      break;
    case 'Build Muscle':
      base = isCompound ? { sets: 3, reps: 10, restSeconds: 120 } : { sets: 3, reps: 12, restSeconds: 75 };
      break;
    default:
      base = isCompound ? { sets: 3, reps: 8, restSeconds: 120 } : { sets: 3, reps: 10, restSeconds: 75 };
  }
  if (experience === 'Beginner') base = { ...base, sets: Math.min(base.sets, 3) };
  return base;
}

/** How often each exercise appears in history, most frequent first, ties broken by recency. */
function rankExercisesByUse(workouts: Workout[]): Map<string, { count: number; last: number }> {
  const stats = new Map<string, { count: number; last: number }>();
  for (const workout of workouts) {
    const t = new Date(workout.date).getTime();
    for (const exercise of workout.exercises ?? []) {
      const key = exercise.exerciseId;
      const current = stats.get(key) ?? { count: 0, last: 0 };
      stats.set(key, { count: current.count + 1, last: Math.max(current.last, t) });
    }
  }
  return stats;
}

export function selectExercisesForSlot(slot: SlotKind, workouts: Workout[]): { id: string; name: string; muscleGroup: MuscleGroup }[] {
  const groups = SLOT_MUSCLE_GROUPS[slot as keyof typeof SLOT_MUSCLE_GROUPS] ?? [];
  const usage = rankExercisesByUse(workouts);
  const chosen: { id: string; name: string; muscleGroup: MuscleGroup }[] = [];
  const used = new Set<string>();
  for (const group of groups) {
    const candidates = exerciseLibrary
      .filter((exercise) => exercise.muscleGroup === group && !used.has(exercise.id))
      .map((exercise) => ({ exercise, stat: usage.get(exercise.id) }))
      .sort((a, b) => {
        const countDiff = (b.stat?.count ?? 0) - (a.stat?.count ?? 0);
        if (countDiff !== 0) return countDiff;
        const lastDiff = (b.stat?.last ?? 0) - (a.stat?.last ?? 0);
        if (lastDiff !== 0) return lastDiff;
        const defaultId = DEFAULT_EXERCISE_BY_GROUP[group];
        if (a.exercise.id === defaultId) return -1;
        if (b.exercise.id === defaultId) return 1;
        return 0;
      });
    const pick = candidates[0]?.exercise;
    if (!pick) continue;
    used.add(pick.id);
    chosen.push({ id: pick.id, name: pick.name, muscleGroup: pick.muscleGroup });
  }
  return chosen;
}

export function roundToIncrement(weight: number, unit: PreferredWeightUnit): number {
  const increment = unit === 'kg' ? 1.25 : 2.5;
  return Math.round(weight / increment) * increment;
}

export interface LoadSuggestion {
  targetWeight?: number;
  note: string;
  increased: boolean;
}

/**
 * Progressive overload from the last logged performance of this exercise:
 * every set reached the target reps -> add 2.5% (upper) or 5% (lower), rounded
 * to the smallest plate. Otherwise hold the load. Moderate readiness never
 * increases.
 */
export function suggestLoad(
  exerciseId: string,
  muscleGroup: MuscleGroup,
  targetReps: number,
  workouts: Workout[],
  unit: PreferredWeightUnit,
  readiness: ReadinessAssessment | undefined
): LoadSuggestion {
  const last = getLastPerformance(workouts, exerciseId);
  if (!last) return { targetWeight: undefined, note: 'New movement here. Pick a load you can control for every set.', increased: false };
  const topWeight = Math.max(...last.sets.map((set) => set.weight));
  if (!Number.isFinite(topWeight) || topWeight <= 0) {
    return { targetWeight: undefined, note: `Last time: ${last.sets.map((set) => set.reps).join(', ')} reps. Match or beat it.`, increased: false };
  }
  const topSets = last.sets.filter((set) => set.weight === topWeight);
  const minReps = Math.min(...topSets.map((set) => set.reps));
  const hitAll = minReps >= targetReps;
  if (hitAll && readiness?.band !== 'moderate') {
    const pct = LOWER_BODY.has(muscleGroup) ? 0.05 : 0.025;
    const raw = topWeight * (1 + pct);
    const increment = unit === 'kg' ? 1.25 : 2.5;
    const next = Math.max(roundToIncrement(raw, unit), topWeight + increment);
    return {
      targetWeight: next,
      note: `Hit ${minReps} reps at ${topWeight} ${unit} last time, so today is ${next} ${unit}.`,
      increased: true,
    };
  }
  if (hitAll) {
    return { targetWeight: topWeight, note: `All reps hit last time, but readiness is moderate, so hold ${topWeight} ${unit}.`, increased: false };
  }
  return { targetWeight: topWeight, note: `Repeat ${topWeight} ${unit} until every set reaches ${targetReps} reps (last time: ${minReps}).`, increased: false };
}

export function buildStrengthBlocks(
  slot: SlotKind,
  profile: CoachProfile,
  workouts: Workout[],
  readiness: ReadinessAssessment | undefined
): { blocks: StrengthBlock[]; progressionNotes: string[] } {
  const exercises = selectExercisesForSlot(slot, workouts);
  const blocks: StrengthBlock[] = [];
  const progressionNotes: string[] = [];
  exercises.forEach((exercise, index) => {
    const isCompound = index < 2;
    const prescription = prescriptionFor(profile.primaryGoal, profile.experienceLevel, isCompound);
    let sets = prescription.sets;
    if (readiness?.band === 'moderate') sets = Math.max(2, sets - 1);
    const load = suggestLoad(exercise.id, exercise.muscleGroup, prescription.reps, workouts, profile.preferredWeightUnit, readiness);
    if (load.increased) progressionNotes.push(`${exercise.name} moves up to ${load.targetWeight} ${profile.preferredWeightUnit} after hitting every rep last time.`);
    blocks.push({
      type: 'strength',
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets,
      reps: prescription.reps,
      targetWeight: load.targetWeight,
      weightUnit: profile.preferredWeightUnit,
      restSeconds: prescription.restSeconds,
      note: load.note,
    });
  });
  return { blocks, progressionNotes };
}

export function estimateStrengthMinutes(blocks: StrengthBlock[]): number {
  const seconds = blocks.reduce((sum, block) => sum + block.sets * (block.reps * 4 + block.restSeconds), 0);
  return Math.round(seconds / 60) + 8;
}
