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

  // Shoulders
  { id: 'shoulder-press', name: 'Shoulder Press', muscleGroup: 'Shoulders' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroup: 'Shoulders' },

  // Back
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back' },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroup: 'Back' },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },

  // Biceps
  { id: 'biceps-curl', name: 'Biceps Curl', muscleGroup: 'Biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'Biceps' },

  // Triceps
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', muscleGroup: 'Triceps' },
  { id: 'overhead-triceps-extension', name: 'Overhead Triceps Extension', muscleGroup: 'Triceps' },

  // Quads
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Quads' },
  { id: 'hack-squat', name: 'Hack Squat', muscleGroup: 'Quads' },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'Quads' },

  // Hamstrings
  { id: 'hamstring-curl', name: 'Hamstring Curl', muscleGroup: 'Hamstrings' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },

  // Glutes
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'Glutes' },

  // Calves
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', muscleGroup: 'Calves' },

  // Core
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'Core' },
  { id: 'plank', name: 'Plank', muscleGroup: 'Core' },
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
