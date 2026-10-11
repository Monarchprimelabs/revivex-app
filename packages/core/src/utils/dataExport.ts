import type { HybridSession, Routine, Run, UserProfile, Workout } from '../types';
import type { BodyWeightEntry } from '../types';

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

// ---------- import ----------

export interface ParsedExport {
  profile: UserProfile | null;
  workouts: Workout[];
  routines: Routine[];
  runs: Run[];
  hybridSessions: HybridSession[];
  bodyWeight: BodyWeightEntry[];
  exportedAt?: string;
}

export interface ParsedExportCounts {
  workouts: number;
  routines: number;
  runs: number;
  hybridSessions: number;
  bodyWeight: number;
}

export type ParseExportResult = { ok: true; data: ParsedExport; counts: ParsedExportCounts } | { ok: false; error: string };

function isRecordWithId(value: unknown): value is { id: string } {
  return Boolean(value) && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string';
}

/**
 * Validates a Revive X export (file text or parsed JSON) and drops malformed
 * records instead of failing the whole import. Pure and Node-testable.
 */
export function parseReviveXExport(input: unknown): ParseExportResult {
  let value: unknown = input;
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch {
      return { ok: false, error: 'That file is not valid JSON.' };
    }
  }
  if (!value || typeof value !== 'object') return { ok: false, error: 'That file is not a Revive X export.' };
  const record = value as Partial<ReviveXExport>;
  if (record.app !== 'ReviveX' || record.exportVersion !== 1 || !record.data || typeof record.data !== 'object') {
    return { ok: false, error: 'That file is not a Revive X export (expected app "ReviveX", version 1).' };
  }
  const data = record.data as Partial<ReviveXExport['data']>;
  const list = <T>(items: unknown, keep: (item: T) => boolean): T[] =>
    Array.isArray(items) ? (items.filter(isRecordWithId) as T[]).filter(keep) : [];

  const workouts = list<Workout>(data.workouts, (w) => typeof w.date === 'string' && Array.isArray(w.exercises));
  const runs = list<Run>(data.runs, (r) => typeof r.date === 'string' && typeof r.distance === 'number' && typeof r.durationSeconds === 'number');
  const hybridSessions = list<HybridSession>(data.hybridSessions, (h) => typeof h.date === 'string' && Array.isArray(h.segments));
  const routines = list<Routine>(data.routines, (r) => typeof r.name === 'string' && Array.isArray(r.exercises));
  const bodyWeight = list<BodyWeightEntry>(data.bodyWeight, (b) => typeof b.date === 'string' && typeof b.weight === 'number');
  const profile = data.profile && typeof data.profile === 'object' && typeof (data.profile as UserProfile).displayName === 'string' ? (data.profile as UserProfile) : null;

  return {
    ok: true,
    data: { profile, workouts, routines, runs, hybridSessions, bodyWeight, exportedAt: typeof record.exportedAt === 'string' ? record.exportedAt : undefined },
    counts: { workouts: workouts.length, routines: routines.length, runs: runs.length, hybridSessions: hybridSessions.length, bodyWeight: bodyWeight.length },
  };
}
