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

export interface HealthAdapter {
  /** User-facing provider name, e.g. "Apple Health" or "Health Connect". */
  providerName: string;
  checkAvailability(): Promise<HealthAvailability>;
  /** Ask the OS for write permission. Resolves true when granted. */
  requestPermissions(): Promise<boolean>;
  writeStrengthWorkout(workout: Workout): Promise<boolean>;
  writeRun(run: Run): Promise<boolean>;
  writeHybridSession(session: HybridSession): Promise<boolean>;
}

export interface HealthSyncSettings {
  syncWorkouts: boolean;
  syncRuns: boolean;
  syncHybrid: boolean;
}

export interface HealthSyncState {
  connected: boolean;
  settings: HealthSyncSettings;
  /** IDs of local items already written to the platform health store. */
  syncedIds: string[];
  lastSyncAt?: string;
}

export const DEFAULT_HEALTH_SYNC_STATE: HealthSyncState = {
  connected: false,
  settings: {
    syncWorkouts: true,
    syncRuns: true,
    syncHybrid: true,
  },
  syncedIds: [],
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
