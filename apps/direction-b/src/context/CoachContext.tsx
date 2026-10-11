import React, { createContext, useCallback, useContext, useMemo } from 'react';
import type {
  DailyPlanRecord,
  ExperienceLevel,
  HybridSession,
  PreferredDistanceUnit,
  PreferredWeightUnit,
  PrimaryGoal,
  ReadinessCheckin,
  Run,
  TrainingFocus,
  Workout,
} from '@revivex/core';
import {
  COACH_ENGINE_VERSION,
  generateDayPlan,
  localDateKey,
  planToHybridSession,
  planToRun,
  planToWorkout,
  readinessScore,
  sessionsThisWeek,
  weekTemplateFor,
  type CoachProfile,
  type DayPlan,
  type ReadinessInput,
  type SlotKind,
} from '@revivex/coach';
import { makeId } from '../lib/ids';
import { useStoredCollection, useStoredValue } from '../store/useStored';

/**
 * CoachContext: the whole Direction B domain in one place.
 * Local-first stores for settings, check-ins, plans and completed sessions,
 * plus the actions the Today screen needs. The engine itself lives in
 * @revivex/coach and is pure; this context only feeds it and stores results.
 */

export interface CoachSettings extends CoachProfile {
  displayName: string;
  setupComplete: boolean;
}

export const DEFAULT_SETTINGS: CoachSettings = {
  displayName: '',
  trainingFocus: 'Hybrid',
  primaryGoal: 'General Fitness',
  experienceLevel: 'Intermediate',
  weeklyTrainingTarget: 4,
  preferredWeightUnit: 'lb',
  preferredDistanceUnit: 'mi',
  setupComplete: false,
};

export const KEYS = {
  settings: 'revivex.daily.settings.v1',
  checkins: 'revivex.daily.checkins.v1',
  plans: 'revivex.daily.plans.v1',
  workouts: 'revivex.daily.workouts.v1',
  runs: 'revivex.daily.runs.v1',
  hybridSessions: 'revivex.daily.hybrid.v1',
} as const;

export interface CompletedSessionSummary {
  kind: 'workout' | 'run' | 'hybrid';
  id: string;
  title: string;
  line: string;
}

interface CoachContextValue {
  loaded: boolean;
  settings: CoachSettings;
  saveSettings: (next: Partial<CoachSettings>) => void;
  checkins: ReadinessCheckin[];
  plans: DailyPlanRecord[];
  workouts: Workout[];
  runs: Run[];
  hybridSessions: HybridSession[];
  todayKey: string;
  todayCheckin: ReadinessCheckin | undefined;
  todayPlan: DailyPlanRecord | undefined;
  weekTemplate: SlotKind[];
  completedThisWeek: number;
  submitCheckin: (input: ReadinessInput, notes?: string) => DailyPlanRecord;
  planWithoutCheckin: () => DailyPlanRecord;
  regeneratePlan: () => DailyPlanRecord | undefined;
  completePlan: (planId: string) => void;
  skipPlan: (planId: string) => void;
  dayPlanOf: (record: DailyPlanRecord) => DayPlan;
  summaryOfCompleted: (record: DailyPlanRecord) => CompletedSessionSummary | undefined;
  /** Merge helpers used by cloud sync. */
  mergeCheckins: (items: ReadinessCheckin[]) => void;
  mergePlans: (items: DailyPlanRecord[]) => void;
  mergeWorkouts: (items: Workout[]) => void;
  mergeRuns: (items: Run[]) => void;
  mergeHybridSessions: (items: HybridSession[]) => void;
}

const CoachContext = createContext<CoachContextValue | undefined>(undefined);

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings, settingsLoaded] = useStoredValue<CoachSettings>(KEYS.settings, DEFAULT_SETTINGS);
  const checkins = useStoredCollection<ReadinessCheckin>(KEYS.checkins);
  const plans = useStoredCollection<DailyPlanRecord>(KEYS.plans);
  const workouts = useStoredCollection<Workout>(KEYS.workouts);
  const runs = useStoredCollection<Run>(KEYS.runs);
  const hybridSessions = useStoredCollection<HybridSession>(KEYS.hybridSessions);

  const loaded = settingsLoaded && checkins.loaded && plans.loaded && workouts.loaded && runs.loaded && hybridSessions.loaded;
  const todayKey = localDateKey(new Date());
  const todayCheckin = checkins.items.find((checkin) => checkin.date === todayKey);
  const todayPlan = plans.items.find((plan) => plan.date === todayKey);

  const profile: CoachProfile = useMemo(
    () => ({
      trainingFocus: settings.trainingFocus,
      primaryGoal: settings.primaryGoal,
      experienceLevel: settings.experienceLevel,
      weeklyTrainingTarget: settings.weeklyTrainingTarget,
      preferredWeightUnit: settings.preferredWeightUnit,
      preferredDistanceUnit: settings.preferredDistanceUnit,
    }),
    [settings]
  );

  const history = useMemo(
    () => ({ workouts: workouts.items, runs: runs.items, hybridSessions: hybridSessions.items }),
    [workouts.items, runs.items, hybridSessions.items]
  );

  const weekTemplate = useMemo(() => weekTemplateFor(profile.trainingFocus, profile.weeklyTrainingTarget), [profile.trainingFocus, profile.weeklyTrainingTarget]);
  const completedThisWeek = useMemo(() => sessionsThisWeek(history, new Date()).length, [history]);

  const saveSettings = useCallback(
    (next: Partial<CoachSettings>) => {
      setSettings({ ...settings, ...next });
    },
    [settings, setSettings]
  );

  const storePlan = useCallback(
    (plan: DayPlan, checkinId: string | undefined): DailyPlanRecord => {
      const now = new Date().toISOString();
      const existing = plans.items.find((candidate) => candidate.date === plan.date);
      const record: DailyPlanRecord = {
        id: existing?.id ?? makeId('plan'),
        date: plan.date,
        kind: plan.kind,
        title: plan.title,
        engineVersion: COACH_ENGINE_VERSION,
        checkinId,
        plan: plan as unknown as Record<string, unknown>,
        status: 'planned',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      plans.upsert(record);
      return record;
    },
    [plans]
  );

  const submitCheckin = useCallback(
    (input: ReadinessInput, notes?: string): DailyPlanRecord => {
      const now = new Date().toISOString();
      const checkin: ReadinessCheckin = {
        id: todayCheckin?.id ?? makeId('ci'),
        date: todayKey,
        sleep: input.sleep,
        soreness: input.soreness,
        energy: input.energy,
        score: readinessScore(input),
        notes: notes?.trim() || undefined,
        createdAt: todayCheckin?.createdAt ?? now,
        updatedAt: now,
      };
      checkins.upsert(checkin);
      const plan = generateDayPlan({ profile, history, readiness: input, date: new Date() });
      return storePlan(plan, checkin.id);
    },
    [checkins, history, profile, storePlan, todayCheckin, todayKey]
  );

  const planWithoutCheckin = useCallback((): DailyPlanRecord => {
    const plan = generateDayPlan({ profile, history, date: new Date() });
    return storePlan(plan, undefined);
  }, [history, profile, storePlan]);

  const regeneratePlan = useCallback((): DailyPlanRecord | undefined => {
    if (!todayPlan) return undefined;
    const readiness = todayCheckin ? { sleep: todayCheckin.sleep, soreness: todayCheckin.soreness, energy: todayCheckin.energy } : undefined;
    const plan = generateDayPlan({ profile, history, readiness, date: new Date() });
    return storePlan(plan, todayCheckin?.id);
  }, [history, profile, storePlan, todayCheckin, todayPlan]);

  const dayPlanOf = useCallback((record: DailyPlanRecord): DayPlan => record.plan as unknown as DayPlan, []);

  const completePlan = useCallback(
    (planId: string) => {
      const record = plans.items.find((candidate) => candidate.id === planId);
      if (!record || record.status === 'completed') return;
      const plan = dayPlanOf(record);
      const now = new Date().toISOString();
      let completedActivityKind: DailyPlanRecord['completedActivityKind'];
      let completedActivityId: string | undefined;
      if (plan.kind === 'lift') {
        const workout = planToWorkout(plan, { id: makeId('wk'), performedAt: now });
        workouts.upsert(workout);
        completedActivityKind = 'workout';
        completedActivityId = workout.id;
      } else if (plan.kind === 'run') {
        const run = planToRun(plan, { id: makeId('run'), performedAt: now });
        runs.upsert(run);
        completedActivityKind = 'run';
        completedActivityId = run.id;
      } else if (plan.kind === 'hybrid') {
        const session = planToHybridSession(plan, { id: makeId('hy'), performedAt: now });
        hybridSessions.upsert(session);
        completedActivityKind = 'hybrid';
        completedActivityId = session.id;
      }
      plans.upsert({ ...record, status: 'completed', completedAt: now, completedActivityKind, completedActivityId, updatedAt: now });
    },
    [dayPlanOf, hybridSessions, plans, runs, workouts]
  );

  const skipPlan = useCallback(
    (planId: string) => {
      const record = plans.items.find((candidate) => candidate.id === planId);
      if (!record || record.status !== 'planned') return;
      plans.upsert({ ...record, status: 'skipped', updatedAt: new Date().toISOString() });
    },
    [plans]
  );

  const summaryOfCompleted = useCallback(
    (record: DailyPlanRecord): CompletedSessionSummary | undefined => {
      if (record.status !== 'completed' || !record.completedActivityId) return undefined;
      if (record.completedActivityKind === 'workout') {
        const workout = workouts.items.find((candidate) => candidate.id === record.completedActivityId);
        if (!workout) return undefined;
        return { kind: 'workout', id: workout.id, title: workout.title, line: `${workout.exercises.length} exercises, ${workout.totalSets} sets` };
      }
      if (record.completedActivityKind === 'run') {
        const run = runs.items.find((candidate) => candidate.id === record.completedActivityId);
        if (!run) return undefined;
        return { kind: 'run', id: run.id, title: run.title, line: `${run.distance} ${run.distanceUnit}, ${Math.round(run.durationSeconds / 60)} min` };
      }
      if (record.completedActivityKind === 'hybrid') {
        const session = hybridSessions.items.find((candidate) => candidate.id === record.completedActivityId);
        if (!session) return undefined;
        return { kind: 'hybrid', id: session.id, title: session.title, line: `${session.segments.length} segments, ${Math.round(session.totalDurationSeconds / 60)} min` };
      }
      return undefined;
    },
    [hybridSessions.items, runs.items, workouts.items]
  );

  const value = useMemo<CoachContextValue>(
    () => ({
      loaded,
      settings,
      saveSettings,
      checkins: checkins.items,
      plans: plans.items,
      workouts: workouts.items,
      runs: runs.items,
      hybridSessions: hybridSessions.items,
      todayKey,
      todayCheckin,
      todayPlan,
      weekTemplate,
      completedThisWeek,
      submitCheckin,
      planWithoutCheckin,
      regeneratePlan,
      completePlan,
      skipPlan,
      dayPlanOf,
      summaryOfCompleted,
      mergeCheckins: checkins.upsertMany,
      mergePlans: plans.upsertMany,
      mergeWorkouts: workouts.upsertMany,
      mergeRuns: runs.upsertMany,
      mergeHybridSessions: hybridSessions.upsertMany,
    }),
    [
      loaded, settings, saveSettings, checkins.items, checkins.upsertMany, plans.items, plans.upsertMany, workouts.items, workouts.upsertMany,
      runs.items, runs.upsertMany, hybridSessions.items, hybridSessions.upsertMany, todayKey, todayCheckin, todayPlan, weekTemplate,
      completedThisWeek, submitCheckin, planWithoutCheckin, regeneratePlan, completePlan, skipPlan, dayPlanOf, summaryOfCompleted,
    ]
  );

  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>;
}

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error('useCoach must be used inside <CoachProvider>');
  return ctx;
}

export const FOCUS_OPTIONS: TrainingFocus[] = ['Lift', 'Run', 'Hybrid', 'General Fitness'];
export const GOAL_OPTIONS: PrimaryGoal[] = ['Build Strength', 'Build Muscle', 'Improve Running', 'Hybrid Performance', 'Weight Loss', 'General Fitness'];
export const EXPERIENCE_OPTIONS: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
export const WEIGHT_UNITS: PreferredWeightUnit[] = ['lb', 'kg'];
export const DISTANCE_UNITS: PreferredDistanceUnit[] = ['mi', 'km'];
