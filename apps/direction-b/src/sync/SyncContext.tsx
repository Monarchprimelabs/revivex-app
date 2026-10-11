import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyPlanRecord, HybridSession, ReadinessCheckin, Run, Workout } from '@revivex/core';
import {
  SupabaseRemoteStore,
  dailyPlanToRow,
  emptySyncState,
  flushOutbox,
  hybridSessionToRow,
  loadSyncState,
  pullTable,
  readinessCheckinToRow,
  reconcileCollection,
  rowToDailyPlan,
  rowToHybridSession,
  rowToReadinessCheckin,
  rowToRun,
  rowToWorkout,
  runToRow,
  saveSyncState,
  statusFor as computeStatus,
  workoutToRow,
  type AnySyncRow,
  type DailyPlanRow,
  type HybridSessionRow,
  type ReadinessCheckinRow,
  type RunRow,
  type SyncState,
  type SyncStatus,
  type SyncTable,
  type WorkoutRow,
} from '@revivex/backend';
import { useAuth } from '../context/AuthContext';
import { useCoach } from '../context/CoachContext';

/**
 * Table-driven local-first mirror for Direction B. Same engine as Direction A,
 * applied to check-ins, plans and completed sessions.
 */

const STORAGE_PREFIX = 'revivex.daily.sync.v1';

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
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { client, user } = useAuth();
  const coach = useCoach();
  const userId = user?.id ?? null;
  const remote = useMemo(() => (client ? new SupabaseRemoteStore(client) : null), [client]);
  const cloudState: CloudState = !client ? 'unconfigured' : userId ? 'active' : 'signedOut';
  const storageKey = userId ? `${STORAGE_PREFIX}.${userId}` : null;

  const specs = useMemo<TableSpec<Item>[]>(
    () =>
      [
        { table: 'readiness_checkins', items: coach.checkins, toRow: (uid, item) => readinessCheckinToRow(uid, item as ReadinessCheckin), fromRow: (row) => rowToReadinessCheckin(row as ReadinessCheckinRow), merge: (items) => coach.mergeCheckins(items as ReadinessCheckin[]) },
        { table: 'daily_plans', items: coach.plans, toRow: (uid, item) => dailyPlanToRow(uid, item as DailyPlanRecord), fromRow: (row) => rowToDailyPlan(row as DailyPlanRow), merge: (items) => coach.mergePlans(items as DailyPlanRecord[]) },
        { table: 'workouts', items: coach.workouts, toRow: (uid, item) => workoutToRow(uid, item as Workout), fromRow: (row) => rowToWorkout(row as WorkoutRow), merge: (items) => coach.mergeWorkouts(items as Workout[]) },
        { table: 'runs', items: coach.runs, toRow: (uid, item) => runToRow(uid, item as Run), fromRow: (row) => rowToRun(row as RunRow), merge: (items) => coach.mergeRuns(items as Run[]) },
        { table: 'hybrid_sessions', items: coach.hybridSessions, toRow: (uid, item) => hybridSessionToRow(uid, item as HybridSession), fromRow: (row) => rowToHybridSession(row as HybridSessionRow), merge: (items) => coach.mergeHybridSessions(items as HybridSession[]) },
      ] as TableSpec<Item>[],
    [coach]
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

  const commit = useCallback(
    (next: SyncState) => {
      if (next === stateRef.current) return;
      stateRef.current = next;
      setState(next);
      if (storageKey) saveSyncState(AsyncStorage, storageKey, next).catch(() => undefined);
    },
    [storageKey]
  );

  const ready = cloudState === 'active' && loadedFor === userId && coach.loaded;

  useEffect(() => {
    if (!ready) return;
    const now = new Date().toISOString();
    let next = stateRef.current;
    for (const spec of specs) next = reconcileCollection(next, spec.table, spec.items, now);
    commit(next);
  }, [ready, specs, commit]);

  const runSync = useCallback(
    async (options: { pull: boolean }) => {
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
          }
        }
        const flushed = await flushOutbox(stateRef.current, {
          remote,
          userId,
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

  useEffect(() => {
    if (!ready) return;
    void runSync({ pull: true });
  }, [ready, runSync]);

  const outboxLength = state.outbox.length;
  useEffect(() => {
    if (!ready || outboxLength === 0) return;
    const timer = setTimeout(() => {
      void runSync({ pull: false });
    }, 1500);
    return () => clearTimeout(timer);
  }, [ready, outboxLength, runSync]);

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
