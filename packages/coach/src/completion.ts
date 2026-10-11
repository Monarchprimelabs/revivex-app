import type { HybridSession, Run, Workout, WorkoutExercise } from '@revivex/core';
import { defaultPerformedAt, planToHybridSession, type CompletionOptions } from './convert';
import { estimateRunMinutes } from './running';
import type { DayPlan, RunBlock, StrengthBlock } from './types';

/**
 * "What I actually did." A completion starts as the plan as written and the
 * athlete edits loads, reps, done flags, skipped exercises, distance or time
 * before saving. Builders turn it into the same records Direction A logs.
 */

export interface SetLog {
  weight?: number;
  reps: number;
  completed: boolean;
}

export interface BlockLog {
  exerciseId: string;
  skipped: boolean;
  sets: SetLog[];
}

export interface LiftCompletion {
  kind: 'lift';
  durationSeconds?: number;
  /** Aligned with the plan's strength blocks, in order. */
  blocks: BlockLog[];
}

export interface RunCompletion {
  kind: 'run';
  distance: number;
  durationSeconds: number;
}

export interface HybridCompletion {
  kind: 'hybrid';
  durationSeconds: number;
}

export interface SimpleCompletion {
  kind: 'recovery' | 'rest';
}

export type PlanCompletion = LiftCompletion | RunCompletion | HybridCompletion | SimpleCompletion;

const NOTE = 'Completed from the daily coach plan.';

export function strengthBlocksOf(plan: DayPlan): StrengthBlock[] {
  return plan.blocks.filter((block): block is StrengthBlock => block.type === 'strength');
}

function runBlockOf(plan: DayPlan): RunBlock | undefined {
  return plan.blocks.find((block): block is RunBlock => block.type === 'run');
}

/** The plan exactly as prescribed, every set done. */
export function defaultCompletion(plan: DayPlan): PlanCompletion {
  if (plan.kind === 'lift') {
    return {
      kind: 'lift',
      durationSeconds: plan.estimatedMinutes * 60,
      blocks: strengthBlocksOf(plan).map((block) => ({
        exerciseId: block.exerciseId,
        skipped: false,
        sets: Array.from({ length: block.sets }, () => ({ weight: block.targetWeight, reps: block.reps, completed: true })),
      })),
    };
  }
  if (plan.kind === 'run') {
    const block = runBlockOf(plan);
    return { kind: 'run', distance: block?.distance ?? 0, durationSeconds: block ? estimateRunMinutes(block) * 60 : 0 };
  }
  if (plan.kind === 'hybrid') return { kind: 'hybrid', durationSeconds: plan.estimatedMinutes * 60 };
  return { kind: plan.kind };
}

/** False when nothing would be logged (every exercise skipped, zero distance, zero time). */
export function completionHasWork(completion: PlanCompletion): boolean {
  switch (completion.kind) {
    case 'lift':
      return completion.blocks.some((block) => !block.skipped && block.sets.some((set) => set.completed));
    case 'run':
      return completion.distance > 0 && completion.durationSeconds > 0;
    case 'hybrid':
      return completion.durationSeconds > 0;
    default:
      return true;
  }
}

export function buildWorkoutFromCompletion(plan: DayPlan, completion: LiftCompletion, options: CompletionOptions): Workout {
  const performedAt = options.performedAt ?? defaultPerformedAt(plan);
  const exercises: WorkoutExercise[] = [];
  strengthBlocksOf(plan).forEach((block, index) => {
    const log = completion.blocks[index];
    if (!log || log.skipped) return;
    const sets = log.sets.map((set, setIndex) => ({
      id: `${options.id}_e${index + 1}_s${setIndex + 1}`,
      setNumber: setIndex + 1,
      weight: Math.max(0, Number.isFinite(set.weight ?? 0) ? (set.weight ?? 0) : 0),
      reps: Math.max(0, Math.floor(Number.isFinite(set.reps) ? set.reps : 0)),
      completed: set.completed,
    }));
    if (sets.length === 0) return;
    exercises.push({ id: `${options.id}_e${index + 1}`, exerciseId: block.exerciseId, exerciseName: block.exerciseName, muscleGroup: block.muscleGroup, restSeconds: block.restSeconds, sets });
  });
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const totalVolume = exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((inner, set) => inner + (set.completed ? set.weight * set.reps : 0), 0), 0);
  return {
    id: options.id,
    title: plan.title,
    date: performedAt,
    startedAt: performedAt,
    duration: Math.max(0, Math.round(options.durationSeconds ?? completion.durationSeconds ?? plan.estimatedMinutes * 60)),
    exercises,
    notes: NOTE,
    totalSets,
    totalVolume,
    updatedAt: new Date().toISOString(),
  };
}

export function buildRunFromCompletion(plan: DayPlan, completion: RunCompletion, options: CompletionOptions): Run {
  const block = runBlockOf(plan);
  if (!block) throw new Error('Plan has no run block');
  const performedAt = options.performedAt ?? defaultPerformedAt(plan);
  const distance = Math.max(0, completion.distance);
  const durationSeconds = Math.max(0, Math.round(completion.durationSeconds));
  const paceSeconds = distance > 0 && durationSeconds > 0 ? Math.round(durationSeconds / distance) : undefined;
  return {
    id: options.id,
    title: plan.title,
    date: performedAt,
    distance,
    distanceUnit: block.distanceUnit,
    durationSeconds,
    paceSecondsPerMile: block.distanceUnit === 'mi' ? paceSeconds : paceSeconds ? Math.round(paceSeconds / 0.621371) : undefined,
    paceSecondsPerKm: block.distanceUnit === 'km' ? paceSeconds : paceSeconds ? Math.round(paceSeconds * 0.621371) : undefined,
    runType: block.runType,
    notes: NOTE,
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function buildHybridFromCompletion(plan: DayPlan, completion: HybridCompletion, options: CompletionOptions): HybridSession {
  return planToHybridSession(plan, { ...options, durationSeconds: Math.max(0, Math.round(completion.durationSeconds)) });
}
