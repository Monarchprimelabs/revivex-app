import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Workout } from '@revivex/core';
import {
  SupabaseRemoteStore,
  emptySyncState,
  flushOutbox,
  loadSyncState,
  pullTable,
  reconcileCollection,
  rowToWorkout,
  saveSyncState,
  statusFor as computeStatus,
  workoutToRow,
  type SyncState,
  type SyncStatus,
  type SyncTable,
  type WorkoutRow,
} from '@revivex/backend';
import { getSupabase } from '../social/supabase';
import { useSocial } from '../context/SocialContext';
import { useWorkout } from '../context/WorkoutContext';

/**
 * SyncContext: local-first cloud mirror.
 *
 * The device stays the source of truth. Whenever a mirrored collection
 * changes, the diff is queued in an outbox and pushed to Supabase under the
 * signed-in user's id. On sign-in, app foreground and once a minute, newer
 * server rows are pulled and merged last-write-wins. Sync state is kept per
 * user under `revivex.sync.v1.<userId>` so switching accounts never mixes
 * tracking data. Slice scope: workouts. Other tables join in breadth.
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

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabase(), []);
  const { session } = useSocial();
  const { history, historyLoaded, mergeWorkouts } = useWorkout();

  const userId = session?.user.id ?? null;
  const remote = useMemo(() => (supabase ? new SupabaseRemoteStore(supabase) : null), [supabase]);
  const cloudState: CloudState = !supabase ? 'unconfigured' : userId ? 'active' : 'signedOut';
  const storageKey = userId ? `${STORAGE_PREFIX}.${userId}` : null;

  const [state, setState] = useState<SyncState>(emptySyncState);
  const stateRef = useRef(state);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const historyRef = useRef(history);
  historyRef.current = history;
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

  const commit = useCallback(
    (next: SyncState) => {
      if (next === stateRef.current) return;
      stateRef.current = next;
      setState(next);
      if (storageKey) saveSyncState(AsyncStorage, storageKey, next).catch(() => undefined);
    },
    [storageKey]
  );

  const ready = cloudState === 'active' && loadedFor === userId && historyLoaded;

  // Queue local changes.
  useEffect(() => {
    if (!ready) return;
    commit(reconcileCollection(stateRef.current, 'workouts', history, new Date().toISOString()));
  }, [ready, history, commit]);

  const getLocal = useCallback((table: SyncTable, clientId: string): unknown => {
    if (table === 'workouts') return historyRef.current.find((workout) => workout.id === clientId);
    return undefined;
  }, []);

  const toRow = useCallback((table: SyncTable, uid: string, item: unknown) => {
    if (table === 'workouts') return workoutToRow(uid, item as Workout);
    throw new Error(`No row mapper for ${table}`);
  }, []);

  const runSync = useCallback(
    async (options: { pull: boolean }) => {
      if (!remote || !userId || busyRef.current) return;
      busyRef.current = true;
      setSyncing(true);
      try {
        if (options.pull) {
          const full = !stateRef.current.lastPulledAt.workouts;
          const pulled = await pullTable<Workout>(stateRef.current, 'workouts', {
            remote,
            userId,
            local: historyRef.current,
            fromRow: (row) => rowToWorkout(row as WorkoutRow),
            full,
          });
          commit(pulled.state);
          if (pulled.applied.length > 0) {
            const applied = new Set(pulled.applied);
            mergeWorkouts(pulled.items.filter((workout) => applied.has(workout.id)));
          }
        }
        const flushed = await flushOutbox(stateRef.current, { remote, userId, getLocal, toRow });
        commit(flushed.state);
        setLastSyncAt(new Date().toISOString());
        setLastError(
          flushed.failed > 0
            ? flushed.state.outbox.find((entry) => entry.lastError)?.lastError ?? 'Some changes did not sync.'
            : null
        );
      } catch (error) {
        setLastError(error instanceof Error ? error.message : String(error));
      } finally {
        busyRef.current = false;
        setSyncing(false);
      }
    },
    [remote, userId, commit, getLocal, toRow, mergeWorkouts]
  );

  // First sync for this user: pull (everything the first time), then push.
  useEffect(() => {
    if (!ready) return;
    void runSync({ pull: true });
  }, [ready, runSync]);

  // Push shortly after local changes land in the outbox.
  const outboxLength = state.outbox.length;
  useEffect(() => {
    if (!ready || outboxLength === 0) return;
    const timer = setTimeout(() => {
      void runSync({ pull: false });
    }, 1500);
    return () => clearTimeout(timer);
  }, [ready, outboxLength, runSync]);

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
