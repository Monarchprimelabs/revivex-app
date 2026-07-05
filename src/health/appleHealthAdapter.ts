import type { HybridSession, Run, Workout } from '../types';
import {
  runDistanceMeters,
  safeSessionRange,
  type HealthAdapter,
  type HealthAvailability,
} from './types';

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
      toShare: ['HKWorkoutTypeIdentifier'],
    });
  } catch {
    return false;
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
};
