import type { HybridSession, Routine, Run, UserProfile, Workout } from '../types';
import type { BodyWeightEntry } from '../context/BodyWeightContext';

/**
 * Builds the full local-data export payload. Pure and Node-testable —
 * file writing and sharing happen at the call site.
 */

export interface ReviveXExport {
  app: 'ReviveX';
  exportVersion: 1;
  exportedAt: string;
  data: {
    profile: UserProfile | null;
    workouts: Workout[];
    routines: Routine[];
    runs: Run[];
    hybridSessions: HybridSession[];
    bodyWeight: BodyWeightEntry[];
  };
}

export function buildExport(input: ReviveXExport['data']): ReviveXExport {
  return {
    app: 'ReviveX',
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    data: input,
  };
}

export function exportFileName(now = new Date()): string {
  return `revivex-export-${now.toISOString().slice(0, 10)}.json`;
}
