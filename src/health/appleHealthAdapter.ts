import type { HybridSession, Run, Workout } from '../types';
import {
  runDistanceMeters,
  safeSessionRange,
  type HealthAdapter,
  type HealthAvailability,
  type HealthDailyActivity,
  type HealthSessionMetrics,
  type ImportedHealthSession,
  type ImportedSessionKind,
} from './types';

/** Our own bundle id — sessions we exported must not echo back as imports. */
const OWN_BUNDLE_ID = 'com.hybridtrack.app';

const IMPORT_QUERY_LIMIT = 200;

/**
 * Apple Health (HealthKit) adapter backed by @kingstinct/react-native-healthkit.
 *
 * The module is a Nitro native module, so importing it inside Expo Go throws.
 * It is only ever loaded lazily inside a try/catch; when it can't load we
 * report 'needs-dev-build' and every write becomes a no-op.
 */

type HealthKitModule = typeof import('@kingstinct/react-native-healthkit');

let cachedModule: HealthKitModule | null | undefined;

function loadHealthKit(): HealthKitModule | null {
  if (cachedModule !== undefined) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedModule = require('@kingstinct/react-native-healthkit') as HealthKitModule;
  } catch {
    // Native module missing (Expo Go) — health sync stays dormant.
    cachedModule = null;
  }
  return cachedModule;
}

async function checkAvailability(): Promise<HealthAvailability> {
  const healthKit = loadHealthKit();
  if (!healthKit) return 'needs-dev-build';

  try {
    const available = await healthKit.isHealthDataAvailableAsync();
    return available ? 'available' : 'unsupported';
  } catch {
    return 'needs-dev-build';
  }
}

async function requestPermissions(): Promise<boolean> {
  const healthKit = loadHealthKit();
  if (!healthKit) return false;

  try {
    return await healthKit.requestAuthorization({
      toShare: ['HKWorkoutTypeIdentifier', 'HKQuantityTypeIdentifierBodyMass'],
      toRead: [
        'HKWorkoutTypeIdentifier',
        'HKQuantityTypeIdentifierHeartRate',
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        'HKQuantityTypeIdentifierStepCount',
      ],
    });
  } catch {
    return false;
  }
}

async function readSessionMetrics(
  dateIso: string,
  durationSeconds: number
): Promise<HealthSessionMetrics | undefined> {
  const healthKit = loadHealthKit();
  if (!healthKit) return undefined;

  const range = safeSessionRange(dateIso, durationSeconds);
  if (!range) return undefined;

  const dateFilter = {
    date: { startDate: range.start, endDate: range.end },
  };

  try {
    const [heartRate, energy] = await Promise.all([
      healthKit
        .queryStatisticsForQuantity(
          'HKQuantityTypeIdentifierHeartRate',
          ['discreteAverage', 'discreteMax'],
          { filter: dateFilter, unit: 'count/min' }
        )
        .catch(() => undefined),
      healthKit
        .queryStatisticsForQuantity(
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          ['cumulativeSum'],
          { filter: dateFilter, unit: 'kcal' }
        )
        .catch(() => undefined),
    ]);

    const metrics: HealthSessionMetrics = {
      avgHeartRateBpm: positiveOrUndefined(heartRate?.averageQuantity?.quantity),
      maxHeartRateBpm: positiveOrUndefined(heartRate?.maximumQuantity?.quantity),
      energyBurnedKcal: positiveOrUndefined(energy?.sumQuantity?.quantity),
    };

    return hasAnyMetric(metrics) ? metrics : undefined;
  } catch {
    return undefined;
  }
}

async function readDailyActivity(): Promise<HealthDailyActivity | undefined> {
  const healthKit = loadHealthKit();
  if (!healthKit) return undefined;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const dateFilter = { date: { startDate: start, endDate: new Date() } };

  try {
    const [steps, energy] = await Promise.all([
      healthKit
        .queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], {
          filter: dateFilter,
          unit: 'count',
        })
        .catch(() => undefined),
      healthKit
        .queryStatisticsForQuantity(
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          ['cumulativeSum'],
          { filter: dateFilter, unit: 'kcal' }
        )
        .catch(() => undefined),
    ]);

    const activity: HealthDailyActivity = {
      steps: positiveOrUndefined(steps?.sumQuantity?.quantity),
      energyBurnedKcal: positiveOrUndefined(energy?.sumQuantity?.quantity),
    };
    return activity.steps !== undefined || activity.energyBurnedKcal !== undefined
      ? activity
      : undefined;
  } catch {
    return undefined;
  }
}

function positiveOrUndefined(value?: number): number | undefined {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : undefined;
}

function hasAnyMetric(metrics: HealthSessionMetrics): boolean {
  return (
    metrics.avgHeartRateBpm !== undefined ||
    metrics.maxHeartRateBpm !== undefined ||
    metrics.energyBurnedKcal !== undefined
  );
}

function distanceToMeters(quantity?: { unit: string; quantity: number }): number | undefined {
  if (!quantity || !Number.isFinite(quantity.quantity) || quantity.quantity <= 0) {
    return undefined;
  }
  switch (quantity.unit) {
    case 'm':
      return quantity.quantity;
    case 'km':
      return quantity.quantity * 1000;
    case 'mi':
      return quantity.quantity * 1609.344;
    default:
      return undefined;
  }
}

async function readRecentSessions(sinceIso: string): Promise<ImportedHealthSession[]> {
  const healthKit = loadHealthKit();
  if (!healthKit) return [];

  const since = new Date(sinceIso);
  if (Number.isNaN(since.getTime())) return [];

  try {
    const workouts = await healthKit.queryWorkoutSamples({
      limit: IMPORT_QUERY_LIMIT,
      ascending: false,
      filter: { date: { startDate: since } },
    });

    const sessions: ImportedHealthSession[] = [];
    for (const workout of workouts) {
      const bundleId = workout.sourceRevision?.source?.bundleIdentifier;
      if (bundleId === OWN_BUNDLE_ID) continue;

      const start = new Date(workout.startDate);
      const end = new Date(workout.endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

      const durationSeconds = Math.max(
        0,
        Math.floor((end.getTime() - start.getTime()) / 1000)
      );
      if (durationSeconds <= 0) continue;

      const activityType = workout.workoutActivityType;
      let kind: ImportedSessionKind;
      let fallbackTitle: string;
      if (activityType === healthKit.WorkoutActivityType.running) {
        kind = 'run';
        fallbackTitle = 'Imported Run';
      } else if (
        activityType === healthKit.WorkoutActivityType.traditionalStrengthTraining ||
        activityType === healthKit.WorkoutActivityType.functionalStrengthTraining
      ) {
        kind = 'strength';
        fallbackTitle = 'Imported Strength Workout';
      } else {
        kind = 'hybrid';
        fallbackTitle = 'Imported Session';
      }

      sessions.push({
        externalId: workout.uuid,
        kind,
        title: fallbackTitle,
        dateIso: start.toISOString(),
        durationSeconds,
        distanceMeters: kind === 'run' ? distanceToMeters(workout.totalDistance) : undefined,
        sourceName: workout.sourceRevision?.source?.name,
      });
    }
    return sessions;
  } catch {
    return [];
  }
}

async function saveSession(
  activityType: number,
  dateIso: string,
  durationSeconds: number,
  totals?: { distance?: number }
): Promise<boolean> {
  const healthKit = loadHealthKit();
  if (!healthKit) return false;

  const range = safeSessionRange(dateIso, durationSeconds);
  if (!range) return false;

  try {
    await healthKit.saveWorkoutSample(activityType, [], range.start, range.end, totals);
    return true;
  } catch {
    return false;
  }
}

export const appleHealthAdapter: HealthAdapter = {
  providerName: 'Apple Health',
  checkAvailability,
  requestPermissions,
  readRecentSessions,
  readSessionMetrics,
  readDailyActivity,

  async writeStrengthWorkout(workout: Workout): Promise<boolean> {
    const healthKit = loadHealthKit();
    if (!healthKit) return false;
    return saveSession(
      healthKit.WorkoutActivityType.traditionalStrengthTraining,
      workout.date,
      workout.duration
    );
  },

  async writeRun(run: Run): Promise<boolean> {
    const healthKit = loadHealthKit();
    if (!healthKit) return false;
    const distance = runDistanceMeters(run);
    return saveSession(
      healthKit.WorkoutActivityType.running,
      run.date,
      run.durationSeconds,
      distance > 0 ? { distance } : undefined
    );
  },

  async writeHybridSession(session: HybridSession): Promise<boolean> {
    const healthKit = loadHealthKit();
    if (!healthKit) return false;
    return saveSession(
      healthKit.WorkoutActivityType.highIntensityIntervalTraining,
      session.date,
      session.totalDurationSeconds
    );
  },

  async writeBodyWeight(entry): Promise<boolean> {
    const healthKit = loadHealthKit();
    if (!healthKit) return false;

    const date = new Date(entry.date);
    if (Number.isNaN(date.getTime()) || !(entry.weight > 0)) return false;

    try {
      const sample = await healthKit.saveQuantitySample(
        'HKQuantityTypeIdentifierBodyMass',
        entry.unit === 'kg' ? 'kg' : 'lb',
        entry.weight,
        date,
        date
      );
      return sample !== undefined;
    } catch {
      return false;
    }
  },
};
