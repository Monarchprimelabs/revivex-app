import type {
  DailyPlanKind,
  ExperienceLevel,
  HybridSession,
  HybridSessionType,
  MuscleGroup,
  PreferredDistanceUnit,
  PreferredWeightUnit,
  PrimaryGoal,
  ReadinessLevel,
  Run,
  RunType,
  TrainingFocus,
  Workout,
} from '@revivex/core';

export const COACH_ENGINE_VERSION = 'coach-0.1.0';

export interface CoachProfile {
  trainingFocus: TrainingFocus;
  primaryGoal: PrimaryGoal;
  experienceLevel: ExperienceLevel;
  weeklyTrainingTarget: number;
  preferredWeightUnit: PreferredWeightUnit;
  preferredDistanceUnit: PreferredDistanceUnit;
}

export interface CoachHistory {
  workouts: Workout[];
  runs: Run[];
  hybridSessions: HybridSession[];
}

export interface ReadinessInput {
  sleep: ReadinessLevel;
  soreness: ReadinessLevel;
  energy: ReadinessLevel;
}

export type ReadinessBand = 'low' | 'moderate' | 'high';

export interface ReadinessAssessment {
  score: number;
  band: ReadinessBand;
  /** Multiplier applied to planned volume. 1 = full session. */
  volumeScale: number;
  summary: string;
}

export type SlotKind =
  | 'upper'
  | 'lower'
  | 'push'
  | 'pull'
  | 'legs'
  | 'full'
  | 'run_easy'
  | 'run_quality'
  | 'run_long'
  | 'hybrid';

export interface StrengthBlock {
  type: 'strength';
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: number;
  reps: number;
  /** Undefined for new or bodyweight movements. */
  targetWeight?: number;
  weightUnit: PreferredWeightUnit;
  restSeconds: number;
  note?: string;
}

export interface RunBlock {
  type: 'run';
  runType: RunType;
  distance: number;
  distanceUnit: PreferredDistanceUnit;
  /** Seconds per distance unit. */
  targetPaceSeconds?: number;
  note?: string;
}

export interface HybridBlock {
  type: 'hybrid';
  sessionType: HybridSessionType;
  segments: { name: string; segmentType: 'run' | 'station'; distance?: number; distanceUnit?: 'mi' | 'km' | 'm' }[];
  rounds: number;
  note?: string;
}

export interface RecoveryBlock {
  type: 'recovery';
  activity: string;
  durationMinutes: number;
  note?: string;
}

export type PlanBlock = StrengthBlock | RunBlock | HybridBlock | RecoveryBlock;

export interface DayPlan {
  /** YYYY-MM-DD in device local time. */
  date: string;
  kind: DailyPlanKind;
  slot?: SlotKind;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  blocks: PlanBlock[];
  /** Plain-language reasons shown under the plan. */
  rationale: string[];
  readiness?: ReadinessAssessment;
  weekTemplate: SlotKind[];
  completedThisWeek: number;
  engineVersion: string;
}

export interface CoachInput {
  profile: CoachProfile;
  history: CoachHistory;
  readiness?: ReadinessInput;
  /** The day to plan for. Defaults to now. */
  date?: Date;
}
