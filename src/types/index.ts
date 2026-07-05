/**
 * Shared types used across the app.
 */

export type ActivityType = 'strength' | 'run' | 'hybrid';

export type ActivityFeedType = 'workout' | 'run' | 'hybrid';

export interface ActivityFeedRoute {
  pathname: '/workout/[id]' | '/run/[id]' | '/hybrid/[id]';
  params: { id: string };
}

export interface ActivityFeedStat {
  label: string;
  value: string;
}

export interface ActivityFeedItem {
  id: string;
  sourceId: string;
  type: ActivityFeedType;
  title: string;
  date: string;
  dateLabel: string;
  subtitle: string;
  stats: ActivityFeedStat[];
  chipLabel: string;
  route: ActivityFeedRoute;
  createdAt?: string;
  timestamp: number;
}

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'
  | 'Cardio'
  | 'Hybrid';

// =======================
// Strength workout types
// =======================

/** A single exercise entry from the library. */
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: string;
}

/** A single set inside a workout exercise. */
export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;       // store as number; UI converts to/from string
  reps: number;
  notes?: string;
  completed?: boolean;
}

/** An exercise that's part of a workout, with its sets. */
export interface WorkoutExercise {
  id: string;           // unique within the workout (lets you add same exercise twice)
  exerciseId: string;   // reference to Exercise.id
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: WorkoutSet[];
  /** Preferred rest between sets, carried over from a routine when present. */
  restSeconds?: number;
}

/** A complete workout (in progress or saved). */
export interface Workout {
  id: string;
  title: string;
  date: string;         // ISO string used for history sorting/display
  startedAt?: string;   // ISO string when the workout timer actually started
  duration: number;     // seconds
  exercises: WorkoutExercise[];
  notes?: string;
  totalSets: number;
  totalVolume: number;  // sum of weight × reps across all completed sets
  updatedAt?: string;
}

// =======================
// Routine builder types
// =======================

export type RoutineGoal =
  | 'Strength'
  | 'Bodybuilding'
  | 'Hybrid'
  | 'Running Support'
  | 'General Fitness';

/** A planned exercise inside a saved routine. */
export interface RoutineExercise {
  id: string;             // unique inside the routine
  exerciseId: string;     // reference to Exercise.id
  exerciseName: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetReps?: number;
  targetWeight?: number;
  restSeconds?: number;
}

/** A saved routine template that can be started as an active workout. */
export interface Routine {
  id: string;
  name: string;
  description?: string;
  goal?: RoutineGoal;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutineInput {
  name: string;
  description?: string;
  goal?: RoutineGoal;
  exercises: RoutineExercise[];
}

// =======================
// Manual run logging types
// =======================

export type DistanceUnit = 'mi' | 'km';

export type RunType =
  | 'Outdoor'
  | 'Treadmill'
  | 'Easy Run'
  | 'Tempo'
  | 'Intervals'
  | 'Long Run'
  | 'Recovery Run'
  | 'Race'
  | 'Other';

export interface Run {
  id: string;
  title: string;
  date: string;
  distance: number;
  distanceUnit: DistanceUnit;
  durationSeconds: number;
  paceSecondsPerMile?: number;
  paceSecondsPerKm?: number;
  runType: RunType;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRunInput {
  title?: string;
  date: string;
  distance: number;
  distanceUnit: DistanceUnit;
  durationSeconds: number;
  runType: RunType;
  location?: string;
  notes?: string;
}

// =======================
// Hybrid session types
// =======================

export type HybridSessionType =
  | 'HYROX Race Sim'
  | 'Hybrid Benchmark'
  | 'Conditioning Circuit'
  | 'Custom Hybrid'
  | 'Other';

export type HybridSegmentType = 'run' | 'station';

export type HybridDistanceUnit = 'mi' | 'km' | 'm';

export interface HybridSegment {
  id: string;
  order: number;
  name: string;
  segmentType: HybridSegmentType;
  distance?: number;
  distanceUnit?: HybridDistanceUnit;
  durationSeconds: number;
  notes?: string;
}

export interface HybridSession {
  id: string;
  title: string;
  date: string;
  sessionType: HybridSessionType;
  totalDurationSeconds: number;
  notes?: string;
  segments: HybridSegment[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateHybridSessionInput {
  title?: string;
  date: string;
  sessionType: HybridSessionType;
  notes?: string;
  segments: Omit<HybridSegment, 'id' | 'order'>[];
}

// =======================
// Profile and onboarding types
// =======================

export type TrainingFocus = 'Lift' | 'Run' | 'Hybrid' | 'General Fitness';

export type PrimaryGoal =
  | 'Build Strength'
  | 'Build Muscle'
  | 'Improve Running'
  | 'Hybrid Performance'
  | 'Weight Loss'
  | 'General Fitness';

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type PreferredWeightUnit = 'lb' | 'kg';

export type PreferredDistanceUnit = 'mi' | 'km';

export interface UserProfile {
  id: string;
  displayName: string;
  username?: string;
  avatarUri?: string;
  trainingFocus: TrainingFocus;
  primaryGoal: PrimaryGoal;
  experienceLevel: ExperienceLevel;
  weeklyTrainingTarget: number;
  preferredWeightUnit: PreferredWeightUnit;
  preferredDistanceUnit: PreferredDistanceUnit;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileInput {
  displayName: string;
  username?: string;
  avatarUri?: string;
  trainingFocus: TrainingFocus;
  primaryGoal: PrimaryGoal;
  experienceLevel: ExperienceLevel;
  weeklyTrainingTarget: number;
  preferredWeightUnit: PreferredWeightUnit;
  preferredDistanceUnit: PreferredDistanceUnit;
}

// =======================
// Static preview types
// =======================

export interface ExercisePreview {
  id: string;
  name: string;
  muscleGroup: string;
}
