/**
 * Static preview data that is not user history.
 * Real workouts, runs, and hybrid sessions come from local contexts.
 */

import type { ExercisePreview } from '../types';

export const exerciseLibraryPreview: ExercisePreview[] = [
  { id: 'e1', name: 'Bench Press', muscleGroup: 'Chest' },
  { id: 'e2', name: 'Back Squat', muscleGroup: 'Legs' },
  { id: 'e3', name: 'Deadlift', muscleGroup: 'Back' },
  { id: 'e4', name: 'Overhead Press', muscleGroup: 'Shoulders' },
];
