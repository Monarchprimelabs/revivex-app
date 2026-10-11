import type {
  BodyWeightEntry,
  DailyPlanRecord,
  HybridSession,
  HybridSessionType,
  ReadinessCheckin,
  ReadinessLevel,
  Routine,
  RoutineGoal,
  Run,
  RunType,
  Workout,
} from '@revivex/core';
import type {
  BodyWeightRow,
  DailyPlanRow,
  HybridSessionRow,
  ReadinessCheckinRow,
  RoutineRow,
  RunRow,
  WorkoutRow,
} from './rows';

/**
 * Mappers between the on-device shapes in @revivex/core and database rows.
 * Pure, round-trip tested. `client_id` is always the device id, so a row maps
 * back to the same local id on every device.
 */

const METERS_PER_MILE = 1609.344;
const METERS_PER_KM = 1000;

function orNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

function orUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null || value === undefined ? undefined : value;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ---------- workouts ----------

export function workoutToRow(userId: string, workout: Workout): WorkoutRow {
  return {
    user_id: userId,
    client_id: workout.id,
    title: workout.title,
    performed_at: workout.date,
    started_at: orNull(workout.startedAt),
    duration_seconds: Math.max(0, Math.floor(workout.duration)),
    total_sets: Math.max(0, Math.floor(workout.totalSets)),
    total_volume: round(Math.max(0, workout.totalVolume), 2),
    notes: orNull(workout.notes),
    source: 'manual',
    exercises: workout.exercises,
  };
}

export function rowToWorkout(row: WorkoutRow): Workout {
  return {
    id: row.client_id,
    title: row.title,
    date: row.performed_at,
    startedAt: orUndefined(row.started_at),
    duration: row.duration_seconds,
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
    notes: orUndefined(row.notes),
    totalSets: row.total_sets,
    totalVolume: Number(row.total_volume),
    updatedAt: row.updated_at,
  };
}

// ---------- runs ----------

export function runToRow(userId: string, run: Run): RunRow {
  const meters = run.distanceUnit === 'km' ? run.distance * METERS_PER_KM : run.distance * METERS_PER_MILE;
  return {
    user_id: userId,
    client_id: run.id,
    title: run.title,
    performed_at: run.date,
    distance_m: round(Math.max(0, meters), 2),
    distance_unit: run.distanceUnit,
    duration_seconds: Math.max(0, Math.floor(run.durationSeconds)),
    run_type: run.runType,
    location: orNull(run.location),
    notes: orNull(run.notes),
    source: run.source ?? 'manual',
    splits: run.splits ?? [],
  };
}

export function rowToRun(row: RunRow): Run {
  const meters = Number(row.distance_m);
  const distance = row.distance_unit === 'km' ? meters / METERS_PER_KM : meters / METERS_PER_MILE;
  const run: Run = {
    id: row.client_id,
    title: row.title,
    date: row.performed_at,
    distance: round(distance, 2),
    distanceUnit: row.distance_unit,
    durationSeconds: row.duration_seconds,
    runType: row.run_type as RunType,
    location: orUndefined(row.location),
    notes: orUndefined(row.notes),
    source: row.source,
    splits: Array.isArray(row.splits) && row.splits.length > 0 ? row.splits : undefined,
    createdAt: row.created_at ?? row.performed_at,
    updatedAt: row.updated_at,
  };
  return run;
}

// ---------- hybrid sessions ----------

export function hybridSessionToRow(userId: string, session: HybridSession): HybridSessionRow {
  return {
    user_id: userId,
    client_id: session.id,
    title: session.title,
    performed_at: session.date,
    session_type: session.sessionType,
    total_duration_seconds: Math.max(0, Math.floor(session.totalDurationSeconds)),
    notes: orNull(session.notes),
    segments: session.segments,
  };
}

export function rowToHybridSession(row: HybridSessionRow): HybridSession {
  return {
    id: row.client_id,
    title: row.title,
    date: row.performed_at,
    sessionType: row.session_type as HybridSessionType,
    totalDurationSeconds: row.total_duration_seconds,
    notes: orUndefined(row.notes),
    segments: Array.isArray(row.segments) ? row.segments : [],
    createdAt: row.created_at ?? row.performed_at,
    updatedAt: row.updated_at,
  };
}

// ---------- routines ----------

export function routineToRow(userId: string, routine: Routine): RoutineRow {
  return {
    user_id: userId,
    client_id: routine.id,
    name: routine.name,
    description: orNull(routine.description),
    goal: orNull(routine.goal),
    exercises: routine.exercises,
  };
}

export function rowToRoutine(row: RoutineRow): Routine {
  return {
    id: row.client_id,
    name: row.name,
    description: orUndefined(row.description),
    goal: orUndefined(row.goal) as RoutineGoal | undefined,
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
    createdAt: row.created_at ?? new Date(0).toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date(0).toISOString(),
  };
}

// ---------- body weight ----------

export function bodyWeightToRow(userId: string, entry: BodyWeightEntry): BodyWeightRow {
  return {
    user_id: userId,
    client_id: entry.id,
    measured_at: entry.date,
    weight: round(entry.weight, 2),
    unit: entry.unit,
  };
}

export function rowToBodyWeight(row: BodyWeightRow): BodyWeightEntry {
  return {
    id: row.client_id,
    date: row.measured_at,
    weight: Number(row.weight),
    unit: row.unit,
    createdAt: row.created_at ?? row.measured_at,
  };
}

// ---------- readiness check-ins ----------

export function readinessCheckinToRow(userId: string, checkin: ReadinessCheckin): ReadinessCheckinRow {
  return {
    user_id: userId,
    client_id: checkin.id,
    checkin_date: checkin.date,
    sleep: checkin.sleep,
    soreness: checkin.soreness,
    energy: checkin.energy,
    score: checkin.score,
    notes: orNull(checkin.notes),
  };
}

export function rowToReadinessCheckin(row: ReadinessCheckinRow): ReadinessCheckin {
  return {
    id: row.client_id,
    date: row.checkin_date,
    sleep: row.sleep as ReadinessLevel,
    soreness: row.soreness as ReadinessLevel,
    energy: row.energy as ReadinessLevel,
    score: row.score,
    notes: orUndefined(row.notes),
    createdAt: row.created_at ?? `${row.checkin_date}T00:00:00.000Z`,
    updatedAt: row.updated_at,
  };
}

// ---------- daily plans ----------

export function dailyPlanToRow(userId: string, record: DailyPlanRecord): DailyPlanRow {
  return {
    user_id: userId,
    client_id: record.id,
    plan_date: record.date,
    kind: record.kind,
    title: record.title,
    engine_version: record.engineVersion,
    checkin_client_id: orNull(record.checkinId),
    plan: record.plan,
    status: record.status,
    completed_activity_kind: orNull(record.completedActivityKind),
    completed_activity_client_id: orNull(record.completedActivityId),
    completed_at: orNull(record.completedAt),
  };
}

export function rowToDailyPlan(row: DailyPlanRow): DailyPlanRecord {
  return {
    id: row.client_id,
    date: row.plan_date,
    kind: row.kind,
    title: row.title,
    engineVersion: row.engine_version,
    checkinId: orUndefined(row.checkin_client_id),
    plan: row.plan ?? {},
    status: row.status,
    completedActivityKind: orUndefined(row.completed_activity_kind),
    completedActivityId: orUndefined(row.completed_activity_client_id),
    completedAt: orUndefined(row.completed_at),
    createdAt: row.created_at ?? `${row.plan_date}T00:00:00.000Z`,
    updatedAt: row.updated_at,
  };
}
