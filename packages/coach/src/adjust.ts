import type { Workout } from '@revivex/core';
import { exerciseLibrary } from '@revivex/core';
import { buildHybridBlock, estimateHybridMinutes } from './hybrid';
import { estimateRunMinutes } from './running';
import { estimateStrengthMinutes, suggestLoad } from './strength';
import type { DayPlan, PlanBlock, StrengthBlock } from './types';

/**
 * Adjustments the athlete can make to today's plan without breaking the week.
 * Pure: they return a new DayPlan and append a rationale line.
 */

function withRationale(plan: DayPlan, line: string): DayPlan {
  return { ...plan, rationale: [...plan.rationale, line] };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Replaces one strength block with the next-best exercise for the same
 * muscle group: most used in history first, library order otherwise, never
 * one already in the plan. Returns the plan unchanged when nothing else fits.
 */
export function swapExercise(plan: DayPlan, blockIndex: number, history: Workout[]): DayPlan {
  const block = plan.blocks[blockIndex];
  if (!block || block.type !== 'strength') return plan;
  const inPlan = new Set(plan.blocks.filter((candidate): candidate is StrengthBlock => candidate.type === 'strength').map((candidate) => candidate.exerciseId));
  const usage = new Map<string, number>();
  for (const workout of history) for (const exercise of workout.exercises ?? []) usage.set(exercise.exerciseId, (usage.get(exercise.exerciseId) ?? 0) + 1);
  const candidates = exerciseLibrary
    .filter((exercise) => exercise.muscleGroup === block.muscleGroup && !inPlan.has(exercise.id))
    .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0));
  const replacement = candidates[0];
  if (!replacement) return plan;
  const load = suggestLoad(replacement.id, replacement.muscleGroup, block.reps, history, block.weightUnit, plan.readiness);
  const nextBlock: StrengthBlock = { ...block, exerciseId: replacement.id, exerciseName: replacement.name, targetWeight: load.targetWeight, note: load.note };
  const blocks = plan.blocks.map((candidate, index) => (index === blockIndex ? nextBlock : candidate));
  return withRationale(
    { ...plan, blocks, estimatedMinutes: estimateStrengthMinutes(blocks.filter((candidate): candidate is StrengthBlock => candidate.type === 'strength')) },
    `Swapped ${block.exerciseName} for ${replacement.name} at your request.`
  );
}

/**
 * Trims the session by about a third: one set fewer per exercise (minimum 2)
 * and no more than four exercises, a shorter run, fewer hybrid rounds, or
 * half the recovery time.
 */
export function shortenPlan(plan: DayPlan): DayPlan {
  if (plan.kind === 'lift') {
    const strength = plan.blocks.filter((block): block is StrengthBlock => block.type === 'strength');
    const trimmed = strength.slice(0, Math.min(strength.length, 4)).map((block) => ({ ...block, sets: Math.max(2, block.sets - 1) }));
    const blocks: PlanBlock[] = trimmed;
    return withRationale(
      { ...plan, blocks, subtitle: `${blocks.length} exercises, ${trimmed.reduce((sum, block) => sum + block.sets, 0)} sets`, estimatedMinutes: estimateStrengthMinutes(trimmed) },
      'Shortened at your request: one set fewer per exercise.'
    );
  }
  if (plan.kind === 'run') {
    const blocks = plan.blocks.map((block) => (block.type === 'run' ? { ...block, distance: Math.max(0.5, round1(block.distance * 0.7)) } : block));
    const run = blocks.find((block) => block.type === 'run');
    return withRationale(
      { ...plan, blocks, subtitle: run && run.type === 'run' ? `${run.distance} ${run.distanceUnit} ${run.runType.toLowerCase()}` : plan.subtitle, estimatedMinutes: run && run.type === 'run' ? estimateRunMinutes(run) : plan.estimatedMinutes },
      'Shortened at your request: 30% less distance.'
    );
  }
  if (plan.kind === 'hybrid') {
    const current = plan.blocks.find((block) => block.type === 'hybrid');
    if (!current || current.type !== 'hybrid') return plan;
    const next = current.rounds > 1 ? { ...current, rounds: current.rounds - 1 } : buildHybridBlock({ score: 50, band: 'moderate', volumeScale: 0.7, summary: '' }).block;
    return withRationale(
      { ...plan, blocks: [next], subtitle: `${next.sessionType}, ${next.rounds} round${next.rounds === 1 ? '' : 's'}`, estimatedMinutes: estimateHybridMinutes(next) },
      'Shortened at your request.'
    );
  }
  if (plan.kind === 'recovery') {
    const blocks = plan.blocks.map((block) => (block.type === 'recovery' ? { ...block, durationMinutes: Math.max(5, Math.round(block.durationMinutes / 2)) } : block));
    const minutes = blocks.reduce((sum, block) => sum + (block.type === 'recovery' ? block.durationMinutes : 0), 0);
    return withRationale({ ...plan, blocks, subtitle: `${minutes} minutes of easy movement`, estimatedMinutes: minutes }, 'Shortened at your request.');
  }
  return plan;
}
