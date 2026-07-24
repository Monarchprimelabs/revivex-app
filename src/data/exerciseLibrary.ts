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
  { id: 'db-bench-press', name: 'Dumbbell Bench Press', muscleGroup: 'Chest' },
  { id: 'incline-barbell-press', name: 'Incline Barbell Press', muscleGroup: 'Chest' },
  { id: 'machine-chest-press', name: 'Machine Chest Press', muscleGroup: 'Chest' },
  { id: 'pec-deck', name: 'Pec Deck Fly', muscleGroup: 'Chest' },

  // Shoulders
  { id: 'shoulder-press', name: 'Shoulder Press', muscleGroup: 'Shoulders' },
  { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { id: 'arnold-press', name: 'Arnold Press', muscleGroup: 'Shoulders' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroup: 'Shoulders' },
  { id: 'face-pull', name: 'Face Pull', muscleGroup: 'Shoulders' },
  { id: 'barbell-shrug', name: 'Barbell Shrug', muscleGroup: 'Shoulders' },
  { id: 'upright-row', name: 'Upright Row', muscleGroup: 'Shoulders' },
  { id: 'front-raise', name: 'Front Raise', muscleGroup: 'Shoulders' },
  { id: 'machine-reverse-fly', name: 'Machine Reverse Fly', muscleGroup: 'Shoulders' },

  // Back
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back' },
  { id: 'pull-up', name: 'Pull-Up', muscleGroup: 'Back' },
  { id: 'chin-up', name: 'Chin-Up', muscleGroup: 'Back' },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroup: 'Back' },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
  { id: 'dumbbell-row', name: 'Single-Arm Dumbbell Row', muscleGroup: 'Back' },
  { id: 't-bar-row', name: 'T-Bar Row', muscleGroup: 'Back' },
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back' },
  { id: 'straight-arm-pulldown', name: 'Straight-Arm Pulldown', muscleGroup: 'Back' },
  { id: 'back-extension', name: 'Back Extension', muscleGroup: 'Back' },

  // Biceps
  { id: 'biceps-curl', name: 'Biceps Curl', muscleGroup: 'Biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'Biceps' },
  { id: 'preacher-curl', name: 'Preacher Curl', muscleGroup: 'Biceps' },
  { id: 'ez-bar-curl', name: 'EZ-Bar Curl', muscleGroup: 'Biceps' },
  { id: 'concentration-curl', name: 'Concentration Curl', muscleGroup: 'Biceps' },
  { id: 'cable-curl', name: 'Cable Curl', muscleGroup: 'Biceps' },

  // Triceps
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', muscleGroup: 'Triceps' },
  { id: 'overhead-triceps-extension', name: 'Overhead Triceps Extension', muscleGroup: 'Triceps' },
  { id: 'skull-crusher', name: 'Skull Crusher', muscleGroup: 'Triceps' },
  { id: 'dips', name: 'Dips', muscleGroup: 'Triceps' },
  { id: 'close-grip-bench-press', name: 'Close-Grip Bench Press', muscleGroup: 'Triceps' },
  { id: 'triceps-kickback', name: 'Triceps Kickback', muscleGroup: 'Triceps' },

  // Quads
  { id: 'barbell-back-squat', name: 'Barbell Back Squat', muscleGroup: 'Quads' },
  { id: 'front-squat', name: 'Front Squat', muscleGroup: 'Quads' },
  { id: 'goblet-squat', name: 'Goblet Squat', muscleGroup: 'Quads' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscleGroup: 'Quads' },
  { id: 'walking-lunge', name: 'Walking Lunge', muscleGroup: 'Quads' },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Quads' },
  { id: 'hack-squat', name: 'Hack Squat', muscleGroup: 'Quads' },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'Quads' },
  { id: 'smith-machine-squat', name: 'Smith Machine Squat', muscleGroup: 'Quads' },
  { id: 'dumbbell-step-up', name: 'Dumbbell Step-Up', muscleGroup: 'Quads' },

  // Hamstrings
  { id: 'hamstring-curl', name: 'Hamstring Curl', muscleGroup: 'Hamstrings' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
  { id: 'good-morning', name: 'Good Morning', muscleGroup: 'Hamstrings' },

  // Glutes
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'Glutes' },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', muscleGroup: 'Glutes' },
  { id: 'hip-abduction', name: 'Hip Abduction Machine', muscleGroup: 'Glutes' },
  { id: 'hip-adduction', name: 'Hip Adduction Machine', muscleGroup: 'Glutes' },
  { id: 'cable-glute-kickback', name: 'Cable Glute Kickback', muscleGroup: 'Glutes' },

  // Calves
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', muscleGroup: 'Calves' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroup: 'Calves' },

  // Core
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'Core' },
  { id: 'plank', name: 'Plank', muscleGroup: 'Core' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'Core' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'Core' },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', muscleGroup: 'Core' },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', muscleGroup: 'Core' },
  { id: 'side-plank', name: 'Side Plank', muscleGroup: 'Core' },

  // Cardio machines
  { id: 'rowing-machine', name: 'Rowing Machine', muscleGroup: 'Cardio' },
  { id: 'air-bike', name: 'Air Bike', muscleGroup: 'Cardio' },

  // Hybrid / conditioning
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', muscleGroup: 'Hybrid' },
  { id: 'box-jump', name: 'Box Jump', muscleGroup: 'Hybrid' },
  { id: 'battle-ropes', name: 'Battle Ropes', muscleGroup: 'Hybrid' },
  { id: 'farmers-carry', name: "Farmer's Carry", muscleGroup: 'Hybrid' },
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
