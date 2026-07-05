import type {
  CreateHybridSessionInput,
  CreateRunInput,
  PreferredDistanceUnit,
} from '../types';
import type { ImportedHealthSession } from './types';

/**
 * Pure mapping from health-store sessions to ReviveX create inputs.
 * Kept free of React Native imports so it can be unit-tested in Node.
 */

export interface ImportedWorkoutInput {
  title: string;
  date: string;
  durationSeconds: number;
  notes?: string;
}

export function importNote(providerName: string, sourceName?: string): string {
  const source = sourceName?.trim();
  return source && source !== providerName
    ? `Imported from ${providerName} (${source})`
    : `Imported from ${providerName}`;
}

export function metersToUnit(meters: number, unit: PreferredDistanceUnit): number {
  const safe = Number.isFinite(meters) ? Math.max(0, meters) : 0;
  const converted = unit === 'km' ? safe / 1000 : safe / 1609.344;
  return Math.round(converted * 100) / 100;
}

export function mapImportedRun(
  session: ImportedHealthSession,
  preferredUnit: PreferredDistanceUnit,
  providerName: string
): CreateRunInput {
  return {
    title: session.title,
    date: session.dateIso,
    distance: metersToUnit(session.distanceMeters ?? 0, preferredUnit),
    distanceUnit: preferredUnit,
    durationSeconds: Math.max(1, Math.floor(session.durationSeconds)),
    runType: 'Outdoor',
    notes: importNote(providerName, session.sourceName),
  };
}

export function mapImportedWorkout(
  session: ImportedHealthSession,
  providerName: string
): ImportedWorkoutInput {
  return {
    title: session.title,
    date: session.dateIso,
    durationSeconds: Math.max(1, Math.floor(session.durationSeconds)),
    notes: importNote(providerName, session.sourceName),
  };
}

export function mapImportedHybrid(
  session: ImportedHealthSession,
  providerName: string
): CreateHybridSessionInput {
  return {
    title: session.title,
    date: session.dateIso,
    sessionType: 'Other',
    notes: importNote(providerName, session.sourceName),
    segments: [
      {
        name: 'Imported Session',
        segmentType: 'station',
        durationSeconds: Math.max(1, Math.floor(session.durationSeconds)),
      },
    ],
  };
}
