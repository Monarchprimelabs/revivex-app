import type {
  ExperienceLevel,
  PreferredDistanceUnit,
  PreferredWeightUnit,
  PrimaryGoal,
  TrainingFocus,
} from '../types';

export const TRAINING_FOCUS_OPTIONS: TrainingFocus[] = [
  'Lift',
  'Run',
  'Hybrid',
  'General Fitness',
];

export const PRIMARY_GOAL_OPTIONS: PrimaryGoal[] = [
  'Build Strength',
  'Build Muscle',
  'Improve Running',
  'Hybrid Performance',
  'Weight Loss',
  'General Fitness',
];

export const EXPERIENCE_LEVEL_OPTIONS: ExperienceLevel[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

export const WEIGHT_UNIT_OPTIONS: PreferredWeightUnit[] = ['lb', 'kg'];

export const DISTANCE_UNIT_OPTIONS: PreferredDistanceUnit[] = ['mi', 'km'];

export const WEEKLY_TARGET_OPTIONS = [2, 3, 4, 5, 6] as const;

export function formatWeeklyTarget(target: number): string {
  return target >= 6 ? '6+ sessions/week' : `${target} sessions/week`;
}
