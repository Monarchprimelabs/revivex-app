import type { HybridSession, Run, Workout } from '../types';
import {
  runDistanceMeters,
  safeSessionRange,
  type HealthAdapter,
  type HealthAvailability,
} from './types';

/**
 * Google Health Connect adapter backed by react-native-health-connect.
 *
 * Like the HealthKit adapter, the native module cannot run inside Expo Go,
 * so it is loaded lazily inside a try/catch and reports 'needs-dev-build'
 * when missing.
 */

type HealthConnectModule = typeof import('react-native-health-connect');

let cachedModule: HealthConnectModule | null | undefined;
let initialized = false;

function loadHealthConnect(): HealthConnectModule | null {
  if (cachedModule !== undefined) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedModule = require('react-native-health-connect') as HealthConnectModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

async function ensureInitialized(healthConnect: HealthConnectModule): Promise<boolean> {
  if (initialized) return true;
  try {
    initialized = await healthConnect.initialize();
  } catch {
    initialized = false;
  }
  return initialized;
}

async function checkAvailability(): Promise<HealthAvailability> {
  const healthConnect = loadHealthConnect();
  if (!healthConnect) return 'needs-dev-build';

  try {
    const status = await healthConnect.getSdkStatus();
    return status === healthConnect.SdkAvailabilityStatus.SDK_AVAILABLE
      ? 'available'
      : 'unsupported';
  } catch {
    return 'needs-dev-build';
  }
}

async function requestPermissions(): Promise<boolean> {
  const healthConnect = loadHealthConnect();
  if (!healthConnect) return false;
  if (!(await ensureInitialized(healthConnect))) return false;

  try {
    const granted = await healthConnect.requestPermission([
      { accessType: 'write', recordType: 'ExerciseSession' },
      { accessType: 'write', recordType: 'Distance' },
    ]);
    return granted.some(
      (permission) =>
        'recordType' in permission && permission.recordType === 'ExerciseSession'
    );
  } catch {
    return false;
  }
}

async function insertExerciseSession(
  exerciseType: number,
  title: string,
  dateIso: string,
  durationSeconds: number
): Promise<{ startTime: string; endTime: string } | undefined> {
  const healthConnect = loadHealthConnect();
  if (!healthConnect) return undefined;
  if (!(await ensureInitialized(healthConnect))) return undefined;

  const range = safeSessionRange(dateIso, durationSeconds);
  if (!range) return undefined;

  const startTime = range.start.toISOString();
  const endTime = range.end.toISOString();

  try {
    await healthConnect.insertRecords([
      {
        recordType: 'ExerciseSession',
        exerciseType,
        title,
        startTime,
        endTime,
      },
    ]);
    return { startTime, endTime };
  } catch {
    return undefined;
  }
}

export const healthConnectAdapter: HealthAdapter = {
  providerName: 'Health Connect',
  checkAvailability,
  requestPermissions,

  async writeStrengthWorkout(workout: Workout): Promise<boolean> {
    const healthConnect = loadHealthConnect();
    if (!healthConnect) return false;
    const inserted = await insertExerciseSession(
      healthConnect.ExerciseType.STRENGTH_TRAINING,
      workout.title,
      workout.date,
      workout.duration
    );
    return inserted !== undefined;
  },

  async writeRun(run: Run): Promise<boolean> {
    const healthConnect = loadHealthConnect();
    if (!healthConnect) return false;

    const inserted = await insertExerciseSession(
      healthConnect.ExerciseType.RUNNING,
      run.title,
      run.date,
      run.durationSeconds
    );
    if (!inserted) return false;

    const meters = runDistanceMeters(run);
    if (meters > 0) {
      try {
        await healthConnect.insertRecords([
          {
            recordType: 'Distance',
            distance: { value: meters, unit: 'meters' },
            startTime: inserted.startTime,
            endTime: inserted.endTime,
          },
        ]);
      } catch {
        // Distance is best-effort; the session itself already synced.
      }
    }
    return true;
  },

  async writeHybridSession(session: HybridSession): Promise<boolean> {
    const healthConnect = loadHealthConnect();
    if (!healthConnect) return false;
    const inserted = await insertExerciseSession(
      healthConnect.ExerciseType.HIGH_INTENSITY_INTERVAL_TRAINING,
      session.title,
      session.date,
      session.totalDurationSeconds
    );
    return inserted !== undefined;
  },
};
