import type {
  DailyPlanKind,
  DailyPlanStatus,
  HybridSegment,
  RoutePoint,
  RoutineExercise,
  RunSplit,
  WorkoutExercise,
} from '@revivex/core';

/** Tables that devices mirror. Every one has `unique (user_id, client_id)`. */
export type SyncTable =
  | 'workouts'
  | 'runs'
  | 'run_routes'
  | 'hybrid_sessions'
  | 'routines'
  | 'body_weight_entries'
  | 'readiness_checkins'
  | 'daily_plans';

export const SYNC_TABLES: SyncTable[] = [
  'workouts',
  'runs',
  'run_routes',
  'hybrid_sessions',
  'routines',
  'body_weight_entries',
  'readiness_checkins',
  'daily_plans',
];

export interface SyncRowBase {
  id?: string;
  user_id: string;
  client_id: string;
  created_at?: string;
  updated_at?: string;
}

/** A row of any mirrored table. Concrete row interfaces extend SyncRowBase. */
export type AnySyncRow = SyncRowBase;

export interface WorkoutRow extends SyncRowBase {
  title: string;
  performed_at: string;
  started_at: string | null;
  duration_seconds: number;
  total_sets: number;
  total_volume: number;
  notes: string | null;
  source: 'manual' | 'routine' | 'import' | 'coach';
  exercises: WorkoutExercise[];
}

export interface RunRow extends SyncRowBase {
  title: string;
  performed_at: string;
  distance_m: number;
  distance_unit: 'mi' | 'km';
  duration_seconds: number;
  run_type: string;
  location: string | null;
  notes: string | null;
  source: 'manual' | 'gps' | 'imported';
  splits: RunSplit[];
}

export interface RunRouteRow extends SyncRowBase {
  points: RoutePoint[];
  point_count: number;
}

export interface HybridSessionRow extends SyncRowBase {
  title: string;
  performed_at: string;
  session_type: string;
  total_duration_seconds: number;
  notes: string | null;
  segments: HybridSegment[];
}

export interface RoutineRow extends SyncRowBase {
  name: string;
  description: string | null;
  goal: string | null;
  exercises: RoutineExercise[];
}

export interface BodyWeightRow extends SyncRowBase {
  measured_at: string;
  weight: number;
  unit: 'lb' | 'kg';
}

export interface ReadinessCheckinRow extends SyncRowBase {
  checkin_date: string;
  sleep: number;
  soreness: number;
  energy: number;
  score: number;
  notes: string | null;
}

export interface DailyPlanRow extends SyncRowBase {
  plan_date: string;
  kind: DailyPlanKind;
  title: string;
  engine_version: string;
  checkin_client_id: string | null;
  plan: Record<string, unknown>;
  status: DailyPlanStatus;
  completed_activity_kind: 'workout' | 'run' | 'hybrid' | null;
  completed_activity_client_id: string | null;
  completed_at: string | null;
}
