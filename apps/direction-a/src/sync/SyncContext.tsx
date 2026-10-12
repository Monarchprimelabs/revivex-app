import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyWeightEntry, HybridSession, Routine, Run, Workout } from '@revivex/core';
import {
  SupabaseRemoteStore,
  bodyWeightToRow,
  emptySyncState,
  flushOutbox,
  hybridSessionToRow,
  loadSyncState,
  pullTable,
  reconcileCollection,
  routineToRow,
  rowToBodyWeight,
  rowToHybridSession,
  rowToRoutine,
  rowToRun,
  rowToRunRoute,
  rowToWorkout,
  runRouteToRow,
  runForSync,
  runRoutesOf,
  runToRow,
  saveSyncState,
  statusFor as computeStatus,
  workoutToRow,
  type AnySyncRow,
  type BodyWeightRow,
  type HybridSessionRow,
  type RoutineRow,
  type RunRouteRecord,
  type RunRouteRow,
  type RunRow,
  type SyncState,
  type SyncStatus,
  type SyncTable,
  type WorkoutRow,
} from '@revivex/backend';
import { getSupabase } from '../social/supabase';
import { useBodyWeight } from '../context/BodyWeightContext';
import { useHybridSessions } from '../context/HybridContext';
import { useRuns } from '../context/RunContext';
import { useSocial } from '../context/SocialContext';
import { useWorkout } from '../context/WorkoutContext';

/**
 * SyncContext: local-first cloud mirror for Direction A.
 *
 * The device stays the source of truth. Whenever a mirrored collection
 * changes, the diff is queued in an outbox and pushed to Supabase under the
 * signed-in user's id. On sign-in, app foreground and once a minute, newer
 * server rows are pulled and merged last-write-wins. Sync state is kept per
 * user under `revivex.sync.v1.<userId>` so switching accounts never mixes
 * tracking data.
 *
 * Mirrored: workouts, routines, runs, GPS traces (own table), hybrid
 * sessions, body weight.
 */

const STORAGE_PREFIX = 'revivex.sync.v1';

export type CloudState = 'unconfigured' | 'signedOut' | 'active';

interface SyncContextValue {
  cloudState: CloudState;
  pendingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
  syncing: boolean;
  statusFor: (table: SyncTable, clientId: string) => SyncStatus;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

type Item = { id: string; updatedAt?: string };

interface TableSpec<T extends Item> {
  table: SyncTable;
  items: T[];
  toRow: (userId: string, item: T) => AnySyncRow;
  fromRow: (row: AnySyncRow) => T;
  merge: (items: T[]) => void;
  /** Apply tombstones pulled from the server. */
  remove: (ids: string[]) => void;
  /** Re-fetch rows whose pull never landed locally (default true). */
  repull?: boolean;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabase(), []);
  const { session } = useSocial();
  const { history, historyLoaded, mergeWorkouts, deleteWorkout, routines, routinesLoaded, mergeRoutines, deleteRoutine } = useWorkout();
  const { runs, runsLoaded, mergeRuns, mergeRunRoutes, deleteRun, clearRunRoutes } = useRuns();
  const { hybridSessions, hybridSessionsLoaded, mergeHybridSessions, deleteHybridSession } = useHybridSessions();
  const { entries, entriesLoaded, mergeEntries, deleteEntry } = useBodyWeight();

  const userId = session?.user.id ?? null;
  const remote = useMemo(() => (supabase ? new SupabaseRemoteStore(supabase) : null), [supabase]);
  const cloudState: CloudState = !supabase ? 'unconfigured' : userId ? 'active' : 'signedOut';
  const storageKey = userId ? `${STORAGE_PREFIX}.${userId}` : null;

  const routes = useMemo(() => runRoutesOf(runs), [runs]);
  // GPS points travel in run_routes; mirroring runs without them keeps a run's
  // fingerprint stable when its trace is attached, so devices never echo it.
  const runsForSync = useMemo(() => runs.map(runForSync), [runs]);

  const specs = useMemo<TableSpec<Item>[]>(
    () =>
      [
        { table: 'workouts', items: history, toRow: (uid, item) => workoutToRow(uid, item as Workout), fromRow: (row) => rowToWorkout(row as WorkoutRow), merge: (items) => mergeWorkouts(items as Workout[]), remove: (ids) => ids.forEach(deleteWorkout) },
        { table: 'routines', items: routines, toRow: (uid, item) => routineToRow(uid, item as Routine), fromRow: (row) => rowToRoutine(row as RoutineRow), merge: (items) => mergeRoutines(items as Routine[]), remove: (ids) => ids.forEach(deleteRoutine) },
        { table: 'runs', items: runsForSync, toRow: (uid, item) => runToRow(uid, item as Run), fromRow: (row) => rowToRun(row as RunRow), merge: (items) => mergeRuns(items as Run[]), remove: (ids) => ids.forEach(deleteRun) },
        { table: 'run_routes', items: routes, toRow: (uid, item) => runRouteToRow(uid, item as RunRouteRecord), fromRow: (row) => rowToRunRoute(row as RunRouteRow), merge: (items) => mergeRunRoutes(items as RunRouteRecord[]), remove: clearRunRoutes, repull: false },
        { table: 'hybrid_sessions', items: hybridSessions, toRow: (uid, item) => hybridSessionToRow(uid, item as HybridSession), fromRow: (row) => rowToHybridSession(row as HybridSessionRow), merge: (items) => mergeHybridSessions(items as HybridSession[]), remove: (ids) => ids.forEach(deleteHybridSession) },
        { table: 'body_weight_entries', items: entries, toRow: (uid, item) => bodyWeightToRow(uid, item as BodyWeightEntry), fromRow: (row) => rowToBodyWeight(row as BodyWeightRow), merge: (items) => mergeEntries(items as BodyWeightEntry[]), remove: (ids) => ids.forEach(deleteEntry) },
      ] as TableSpec<Item>[],
    [history, routines, runsForSync, routes, hybridSessions, entries, mergeWorkouts, mergeRoutines, mergeRuns, mergeRunRoutes, mergeHybridSessions, mergeEntries, deleteWorkout, deleteRoutine, deleteRun, clearRunRoutes, deleteHybridSession, deleteEntry]
  );
  const specsRef = useRef(specs);
  specsRef.current = specs;

  const [state, setState] = useState<SyncState>(emptySyncState);
  const stateRef = useRef(state);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Load this user's sync state on sign-in; forget it on sign-out.
  useEffect(() => {
    let cancelled = false;
    if (!storageKey) {
      stateRef.current = emptySyncState();
      setState(stateRef.current);
      setLoadedFor(null);
      setLastSyncAt(null);
      setLastError(null);
      return;
    }
    loadSyncState(AsyncStorage, storageKey).then((loaded) => {
      if (cancelled) return;
      stateRef.current = loaded;
      setState(loaded);
      setLoadedFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey, userId]);

  const keyRef = useRef(storageKey);
  keyRef.current = storageKey;
  const pendingSaveKey = useRef<string | null>(null);

  const commit = useCallback(
    (next: SyncState) => {
      if (next === stateRef.current) return;
      stateRef.current = next;
      setState(next);
      if (!storageKey || pendingSaveKey.current === storageKey) return;
      pendingSaveKey.current = storageKey;
      // Save on the next tick, after the data providers above have written their
      // collections. Sync bookkeeping must never be stored ahead of the data it
      // describes, or an app closed mid-sync could misread what changed.
      setTimeout(() => {
        const key = pendingSaveKey.current;
        pendingSaveKey.current = null;
        if (!key || keyRef.current !== key) return;
        saveSyncState(AsyncStorage, key, stateRef.current).catch(() => undefined);
      }, 0);
    },
    [storageKey]
  );

  const collectionsLoaded = historyLoaded && routinesLoaded && runsLoaded && hybridSessionsLoaded && entriesLoaded;
  const ready = cloudState === 'active' && loadedFor === userId && collectionsLoaded;

  // Queue local changes.
  useEffect(() => {
    if (!ready) return;
    const now = new Date().toISOString();
    let next = stateRef.current;
    for (const spec of specs) next = reconcileCollection(next, spec.table, spec.items, now, { repull: spec.repull !== false });
    commit(next);
  }, [ready, specs, commit]);

  const runSync = useCallback(
    async (options: { pull: boolean; onlyFresh?: boolean }) => {
      if (!remote || !userId || busyRef.current) return;
      busyRef.current = true;
      setSyncing(true);
      try {
        if (options.pull) {
          for (const spec of specsRef.current) {
            const full = !stateRef.current.lastPulledAt[spec.table];
            const pulled = await pullTable<Item>(stateRef.current, spec.table, { remote, userId, local: spec.items, fromRow: spec.fromRow, full });
            commit(pulled.state);
            if (pulled.applied.length > 0) {
              const applied = new Set(pulled.applied);
              spec.merge(pulled.items.filter((item) => applied.has(item.id)));
            }
            if (pulled.removed.length > 0) spec.remove(pulled.removed);
          }
        }
        const flushed = await flushOutbox(stateRef.current, {
          remote,
          userId,
          onlyFresh: options.onlyFresh,
          getLocal: (table, clientId) => specsRef.current.find((spec) => spec.table === table)?.items.find((item) => item.id === clientId),
          toRow: (table, uid, item) => {
            const spec = specsRef.current.find((candidate) => candidate.table === table);
            if (!spec) throw new Error(`No row mapper for ${table}`);
            return spec.toRow(uid, item as Item);
          },
        });
        commit(flushed.state);
        setLastSyncAt(new Date().toISOString());
        setLastError(flushed.failed > 0 ? flushed.state.outbox.find((entry) => entry.lastError)?.lastError ?? 'Some changes did not sync.' : null);
      } catch (error) {
        setLastError(error instanceof Error ? error.message : String(error));
      } finally {
        busyRef.current = false;
        setSyncing(false);
      }
    },
    [remote, userId, commit]
  );

  // First sync for this user: pull (everything the first time), then push.
  useEffect(() => {
    if (!ready) return;
    void runSync({ pull: true });
  }, [ready, runSync]);

  // Push shortly after local changes land in the outbox, and keep draining new
  // changes after each sync finishes (large first syncs go 50 at a time).
  // Entries that already failed wait for the minute timer, foreground or Sync
  // now, so being offline never turns into a retry loop.
  const freshCount = useMemo(() => state.outbox.filter((entry) => !entry.lastError).length, [state.outbox]);
  useEffect(() => {
    if (!ready || freshCount === 0 || syncing) return;
    const timer = setTimeout(() => {
      void runSync({ pull: false, onlyFresh: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [ready, freshCount, syncing, runSync]);

  // Keep fresh while the app is open.
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      void runSync({ pull: true });
    }, 60_000);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void runSync({ pull: true });
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [ready, runSync]);

  const value = useMemo<SyncContextValue>(
    () => ({
      cloudState,
      pendingCount: state.outbox.length,
      lastSyncAt,
      lastError,
      syncing,
      statusFor: (table, clientId) => computeStatus(state, table, clientId, cloudState === 'active'),
      syncNow: () => runSync({ pull: true }),
    }),
    [cloudState, state, lastSyncAt, lastError, syncing, runSync]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside <SyncProvider>');
  return ctx;
}
