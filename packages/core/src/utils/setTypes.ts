import type { WorkoutSet, WorkoutSetType } from '../types';

export const SET_TYPE_ORDER: WorkoutSetType[] = ['normal', 'warmup', 'drop', 'failure'];

export const SET_TYPE_LABELS: Record<WorkoutSetType, { short: string; label: string }> = {
  normal: { short: '', label: 'Working set' },
  warmup: { short: 'W', label: 'Warm-up' },
  drop: { short: 'D', label: 'Drop set' },
  failure: { short: 'F', label: 'To failure' },
};

export function setTypeOf(set: Pick<WorkoutSet, 'setType'>): WorkoutSetType {
  return set.setType ?? 'normal';
}

/** Warm-ups prepare the working sets; they never count toward volume or records. */
export function isWorkingSet(set: Pick<WorkoutSet, 'setType'>): boolean {
  return setTypeOf(set) !== 'warmup';
}

export function nextSetType(current: WorkoutSetType | undefined): WorkoutSetType {
  const index = SET_TYPE_ORDER.indexOf(current ?? 'normal');
  return SET_TYPE_ORDER[(index + 1) % SET_TYPE_ORDER.length];
}
