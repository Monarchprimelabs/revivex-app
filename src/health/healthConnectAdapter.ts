import type { HybridSession, Run, Workout } from '../types';
import {
  runDistanceMeters,
  safeSessionRange,
  type HealthAdapter,
  type HealthAvailability,
  type ImportedHealthSession,
  type ImportedSessionKind,
} from './types';

/** Our own package name — sessions we exported must not echo back as imports. */
const OWN_PACKAGE_NAME = 'com.hybridtrack.app';

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
      { accessType: 'read', recordType: 'ExerciseSession' },
      { accessType: 'read', recordType: 'Distance' },
    ]);
    return granted.some(
      (permission) =>
        'recordType' in permission && permission.recordType === 'ExerciseSession'
    );
  } catch {
    return false;
  }
}

function sessionKindOf(
  healthConnect: HealthConnectModule,
  exerciseType: number
): { kind: ImportedSessionKind; fallbackTitle: string } {
  if (
    exerciseType === healthConnect.ExerciseType.RUNNING ||
    exerciseType === healthConnect.ExerciseType.RUNNING_TREADMILL
  ) {
    return { kind: 'run', fallbackTitle: 'Imported Run' };
  }
  if (exerciseType === healthConnect.ExerciseType.STRENGTH_TRAINING) {
    return { kind: 'strength', fallbackTitle: 'Imported Strength Workout' };
  }
  return { kind: 'hybrid', fallbackTitle: 'Imported Session' };
}

async function readSessionDistanceMeters(
  healthConnect: HealthConnectModule,
  startTime: string,
  endTime: string
): Promise<number | undefined> {
  try {
    const result = await healthConnect.readRecords('Distance', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });
    const meters = result.records.reduce((sum, record) => {
      if (record.metadata?.dataOrigin === OWN_PACKAGE_NAME) return sum;
      const value = record.distance.inMeters;
      return sum + (Number.isFinite(value) ? Math.max(0, value) : 0);
    }, 0);
    return meters > 0 ? meters : undefined;
  } catch {
    return undefined;
  }
}

async function readRecentSessions(sinceIso: string): Promise<ImportedHealthSession[]> {
  const healthConnect = loadHealthConnect();
  if (!healthConnect) return [];
  if (!(await ensureInitialized(healthConnect))) return [];

  try {
    const result = await healthConnect.readRecords('ExerciseSession', {
      timeRangeFilter: { operator: 'after', startTime: sinceIso },
    });

    const sessions: ImportedHealthSession[] = [];
    for (const record of result.records) {
      const externalId = record.metadata?.id;
      if (!externalId) continue;
      if (record.metadata?.dataOrigin === OWN_PACKAGE_NAME) continue;

      const start = new Date(record.startTime);
      const end = new Date(record.endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

      const durationSeconds = Math.max(
        0,
        Math.floor((end.getTime() - start.getTime()) / 1000)
      );
      if (durationSeconds <= 0) continue;

      const { kind, fallbackTitle } = sessionKindOf(healthConnect, record.exerciseType);
      const distanceMeters =
        kind === 'run'
          ? await readSessionDistanceMeters(healthConnect, record.startTime, record.endTime)
          : undefined;

      sessions.push({
        externalId,
        kind,
        title: record.title?.trim() || fallbackTitle,
        dateIso: start.toISOString(),
        durationSeconds,
        distanceMeters,
        sourceName: record.metadata?.dataOrigin,
      });
    }
    return sessions;
  } catch {
    return [];
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
  readRecentSessions,

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
