import type { HybridSession, Run, Workout } from '../types';

/**
 * Health sync types shared by the Apple Health (iOS) and
 * Health Connect (Android) adapters.
 *
 * IMPORTANT: the native health modules cannot run inside Expo Go.
 * Adapters must load them lazily and report 'needs-dev-build' when the
 * native module is missing so the rest of the app keeps working.
 */

export type HealthAvailability =
  | 'available'
  | 'needs-dev-build'
  | 'unsupported';

/** Local activity kind a health-store session maps onto. */
export type ImportedSessionKind = 'run' | 'strength' | 'hybrid';

/** A workout/exercise session read back from the platform health store. */
export interface ImportedHealthSession {
  /** Stable platform ID (HealthKit UUID / Health Connect record id). */
  externalId: string;
  kind: ImportedSessionKind;
  title: string;
  dateIso: string;
  durationSeconds: number;
  distanceMeters?: number;
  /** Recording app/device name when the platform provides it. */
  sourceName?: string;
}

/** Heart rate / energy metrics for one session's time window. */
export interface HealthSessionMetrics {
  avgHeartRateBpm?: number;
  maxHeartRateBpm?: number;
  energyBurnedKcal?: number;
}

export interface HealthAdapter {
  /** User-facing provider name, e.g. "Apple Health" or "Health Connect". */
  providerName: string;
  checkAvailability(): Promise<HealthAvailability>;
  /** Ask the OS for read + write permission. Resolves true when granted. */
  requestPermissions(): Promise<boolean>;
  writeStrengthWorkout(workout: Workout): Promise<boolean>;
  writeRun(run: Run): Promise<boolean>;
  writeHybridSession(session: HybridSession): Promise<boolean>;
  /**
   * Read sessions recorded since the given ISO date, excluding sessions
   * this app wrote itself (so exports don't echo back as imports).
   */
  readRecentSessions(sinceIso: string): Promise<ImportedHealthSession[]>;
  /**
   * Heart rate and active energy recorded during a session's time window
   * (e.g. by a watch). Returns undefined when nothing was recorded.
   */
  readSessionMetrics(
    dateIso: string,
    durationSeconds: number
  ): Promise<HealthSessionMetrics | undefined>;
}

export interface HealthSyncSettings {
  syncWorkouts: boolean;
  syncRuns: boolean;
  syncHybrid: boolean;
  /** Automatically import new health-store sessions when the app opens. */
  autoImport: boolean;
}

export interface HealthSyncState {
  connected: boolean;
  settings: HealthSyncSettings;
  /** IDs of local items already written to the platform health store. */
  syncedIds: string[];
  lastSyncAt?: string;
  /** External health-store IDs already imported into local logs. */
  importedIds: string[];
  lastImportAt?: string;
}

export const DEFAULT_HEALTH_SYNC_STATE: HealthSyncState = {
  connected: false,
  settings: {
    syncWorkouts: true,
    syncRuns: true,
    syncHybrid: true,
    autoImport: true,
  },
  syncedIds: [],
  importedIds: [],
};

/** Clamp a start/end pair so health stores never see end <= start. */
export function safeSessionRange(dateIso: string, durationSeconds: number) {
  const start = new Date(dateIso);
  if (Number.isNaN(start.getTime())) return undefined;

  const safeDuration = Math.max(
    60,
    Math.floor(Number.isFinite(durationSeconds) ? durationSeconds : 0)
  );
  const end = new Date(start.getTime() + safeDuration * 1000);
  return { start, end };
}

export function runDistanceMeters(run: Run): number {
  const distance = Number.isFinite(run.distance) ? Math.max(0, run.distance) : 0;
  return run.distanceUnit === 'km' ? distance * 1000 : distance * 1609.344;
}
