/**
 * Starter exercise library.
 * Hardcoded for now — a later phase will let users add custom exercises.
 */

import type { Exercise } from '../types';

export const exerciseLibrary: Exercise[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { id: 'dumbbell-fly', name: 'Dumbbell Fly', muscleGroup: 'Chest' },
  { id: 'cable-crossover', name: 'Cable Crossover', muscleGroup: 'Chest' },
  { id: 'push-up', name: 'Push-Up', muscleGroup: 'Chest' },

  // Shoulders
  { id: 'shoulder-press', name: 'Shoulder Press', muscleGroup: 'Shoulders' },
  { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { id: 'arnold-press', name: 'Arnold Press', muscleGroup: 'Shoulders' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroup: 'Shoulders' },
  { id: 'face-pull', name: 'Face Pull', muscleGroup: 'Shoulders' },
  { id: 'barbell-shrug', name: 'Barbell Shrug', muscleGroup: 'Shoulders' },

  // Back
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back' },
  { id: 'pull-up', name: 'Pull-Up', muscleGroup: 'Back' },
  { id: 'chin-up', name: 'Chin-Up', muscleGroup: 'Back' },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroup: 'Back' },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
  { id: 'dumbbell-row', name: 'Single-Arm Dumbbell Row', muscleGroup: 'Back' },
  { id: 't-bar-row', name: 'T-Bar Row', muscleGroup: 'Back' },
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back' },

  // Biceps
  { id: 'biceps-curl', name: 'Biceps Curl', muscleGroup: 'Biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'Biceps' },
  { id: 'preacher-curl', name: 'Preacher Curl', muscleGroup: 'Biceps' },

  // Triceps
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', muscleGroup: 'Triceps' },
  { id: 'overhead-triceps-extension', name: 'Overhead Triceps Extension', muscleGroup: 'Triceps' },
  { id: 'skull-crusher', name: 'Skull Crusher', muscleGroup: 'Triceps' },
  { id: 'dips', name: 'Dips', muscleGroup: 'Triceps' },

  // Quads
  { id: 'barbell-back-squat', name: 'Barbell Back Squat', muscleGroup: 'Quads' },
  { id: 'front-squat', name: 'Front Squat', muscleGroup: 'Quads' },
  { id: 'goblet-squat', name: 'Goblet Squat', muscleGroup: 'Quads' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscleGroup: 'Quads' },
  { id: 'walking-lunge', name: 'Walking Lunge', muscleGroup: 'Quads' },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Quads' },
  { id: 'hack-squat', name: 'Hack Squat', muscleGroup: 'Quads' },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'Quads' },

  // Hamstrings
  { id: 'hamstring-curl', name: 'Hamstring Curl', muscleGroup: 'Hamstrings' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
  { id: 'good-morning', name: 'Good Morning', muscleGroup: 'Hamstrings' },

  // Glutes
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'Glutes' },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', muscleGroup: 'Glutes' },

  // Calves
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', muscleGroup: 'Calves' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroup: 'Calves' },

  // Core
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'Core' },
  { id: 'plank', name: 'Plank', muscleGroup: 'Core' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'Core' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'Core' },

  // Hybrid / conditioning
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', muscleGroup: 'Hybrid' },
];

/**
 * Display order for the picker — strength groups first, then conditioning.
 * The picker filters out empty buckets, so only groups with exercises render.
 */
export const muscleGroupDisplayOrder = [
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
  'Cardio',
  'Hybrid',
] as const;
