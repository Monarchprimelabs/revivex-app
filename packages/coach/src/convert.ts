import type { HybridSegment, HybridSession, Run, Workout, WorkoutExercise } from '@revivex/core';
import type { DayPlan, HybridBlock, RunBlock, StrengthBlock } from './types';
import { estimateRunMinutes } from './running';

export interface CompletionOptions {
  /** Device id for the new record. */
  id: string;
  /** When the session happened. Defaults to the plan date at noon local time. */
  performedAt?: string;
  /** Actual duration, if known. */
  durationSeconds?: number;
}

function defaultPerformedAt(plan: DayPlan): string {
  const [y, m, d] = plan.date.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

/** Turns a completed lift plan into a Workout, assuming every prescribed set was done as written. */
export function planToWorkout(plan: DayPlan, options: CompletionOptions): Workout {
  const blocks = plan.blocks.filter((block): block is StrengthBlock => block.type === 'strength');
  const performedAt = options.performedAt ?? defaultPerformedAt(plan);
  const exercises: WorkoutExercise[] = blocks.map((block, index) => ({
    id: `${options.id}_e${index + 1}`,
    exerciseId: block.exerciseId,
    exerciseName: block.exerciseName,
    muscleGroup: block.muscleGroup,
    restSeconds: block.restSeconds,
    sets: Array.from({ length: block.sets }, (_, setIndex) => ({
      id: `${options.id}_e${index + 1}_s${setIndex + 1}`,
      setNumber: setIndex + 1,
      weight: block.targetWeight ?? 0,
      reps: block.reps,
      completed: true,
    })),
  }));
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const totalVolume = exercises.reduce(
    (sum, exercise) => sum + exercise.sets.reduce((inner, set) => inner + set.weight * set.reps, 0),
    0
  );
  return {
    id: options.id,
    title: plan.title,
    date: performedAt,
    startedAt: performedAt,
    duration: options.durationSeconds ?? plan.estimatedMinutes * 60,
    exercises,
    notes: 'Completed from the daily coach plan.',
    totalSets,
    totalVolume,
    updatedAt: new Date().toISOString(),
  };
}

export function planToRun(plan: DayPlan, options: CompletionOptions): Run {
  const block = plan.blocks.find((candidate): candidate is RunBlock => candidate.type === 'run');
  if (!block) throw new Error('Plan has no run block');
  const performedAt = options.performedAt ?? defaultPerformedAt(plan);
  const durationSeconds = options.durationSeconds ?? estimateRunMinutes(block) * 60;
  const paceSeconds = block.distance > 0 ? Math.round(durationSeconds / block.distance) : undefined;
  return {
    id: options.id,
    title: plan.title,
    date: performedAt,
    distance: block.distance,
    distanceUnit: block.distanceUnit,
    durationSeconds,
    paceSecondsPerMile: block.distanceUnit === 'mi' ? paceSeconds : paceSeconds ? Math.round(paceSeconds / 0.621371) : undefined,
    paceSecondsPerKm: block.distanceUnit === 'km' ? paceSeconds : paceSeconds ? Math.round(paceSeconds * 0.621371) : undefined,
    runType: block.runType,
    notes: 'Completed from the daily coach plan.',
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function planToHybridSession(plan: DayPlan, options: CompletionOptions): HybridSession {
  const block = plan.blocks.find((candidate): candidate is HybridBlock => candidate.type === 'hybrid');
  if (!block) throw new Error('Plan has no hybrid block');
  const performedAt = options.performedAt ?? defaultPerformedAt(plan);
  const total = options.durationSeconds ?? plan.estimatedMinutes * 60;
  const expanded = Array.from({ length: block.rounds }, () => block.segments).flat();
  const each = expanded.length > 0 ? Math.round(total / expanded.length) : total;
  const segments: HybridSegment[] = expanded.map((segment, index) => ({
    id: `${options.id}_seg${index + 1}`,
    order: index + 1,
    name: segment.name,
    segmentType: segment.segmentType,
    distance: segment.distance,
    distanceUnit: segment.distanceUnit,
    durationSeconds: each,
  }));
  return {
    id: options.id,
    title: plan.title,
    date: performedAt,
    sessionType: block.sessionType,
    totalDurationSeconds: total,
    notes: 'Completed from the daily coach plan.',
    segments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
