import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHealthAdapter } from '../health/healthService';
import {
  DEFAULT_HEALTH_SYNC_STATE,
  type HealthAvailability,
  type HealthSyncSettings,
  type HealthSyncState,
} from '../health/types';
import { useWorkout } from './WorkoutContext';
import { useRuns } from './RunContext';
import { useHybridSessions } from './HybridContext';

/**
 * HealthContext
 * --------------
 * Owns Apple Health / Health Connect sync:
 *  - persisted sync settings, connection flag, and synced-item IDs
 *  - a one-way sync engine that writes completed workouts, runs, and
 *    hybrid sessions to the platform health store as they appear
 *
 * In Expo Go the native health modules are missing; availability reports
 * 'needs-dev-build' and everything else stays dormant. No crash, no sync.
 */

const HEALTH_STORAGE_KEY = 'revivex.health.v1';

type HealthStatus = 'checking' | HealthAvailability | 'no-adapter';

interface HealthContextValue {
  status: HealthStatus;
  providerName: string;
  connected: boolean;
  settings: HealthSyncSettings;
  syncedCount: number;
  pendingCount: number;
  lastSyncAt?: string;
  healthLoaded: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  updateSettings: (patch: Partial<HealthSyncSettings>) => void;
  syncNow: () => Promise<void>;
}

const HealthContext = createContext<HealthContextValue | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
}

export function HealthProvider({ children }: ProviderProps) {
  const adapter = useMemo(() => getHealthAdapter(), []);
  const { history, historyLoaded } = useWorkout();
  const { runs, runsLoaded } = useRuns();
  const { hybridSessions, hybridSessionsLoaded } = useHybridSessions();

  const [status, setStatus] = useState<HealthStatus>('checking');
  const [syncState, setSyncState] = useState<HealthSyncState>(DEFAULT_HEALTH_SYNC_STATE);
  const [healthLoaded, setHealthLoaded] = useState(false);
  const syncingRef = useRef(false);

  // Load persisted sync state once.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HEALTH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<HealthSyncState>;
          setSyncState({
            ...DEFAULT_HEALTH_SYNC_STATE,
            ...parsed,
            settings: { ...DEFAULT_HEALTH_SYNC_STATE.settings, ...parsed.settings },
            syncedIds: Array.isArray(parsed.syncedIds) ? parsed.syncedIds : [],
          });
        }
      } catch (err) {
        console.warn('Failed to load health sync state:', err);
      } finally {
        setHealthLoaded(true);
      }
    })();
  }, []);

  // Persist sync state whenever it changes (after initial load).
  useEffect(() => {
    if (!healthLoaded) return;
    AsyncStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(syncState)).catch((err) =>
      console.warn('Failed to save health sync state:', err)
    );
  }, [syncState, healthLoaded]);

  // Check platform availability once.
  useEffect(() => {
    if (!adapter) {
      setStatus('no-adapter');
      return;
    }
    let cancelled = false;
    adapter
      .checkAvailability()
      .then((availability) => {
        if (!cancelled) setStatus(availability);
      })
      .catch(() => {
        if (!cancelled) setStatus('needs-dev-build');
      });
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  const pendingItems = useMemo(() => {
    const synced = new Set(syncState.syncedIds);
    const workouts = syncState.settings.syncWorkouts
      ? history.filter((workout) => !synced.has(workout.id))
      : [];
    const pendingRuns = syncState.settings.syncRuns
      ? runs.filter((run) => !synced.has(run.id))
      : [];
    const sessions = syncState.settings.syncHybrid
      ? hybridSessions.filter((session) => !synced.has(session.id))
      : [];
    return { workouts, runs: pendingRuns, sessions };
  }, [history, runs, hybridSessions, syncState.settings, syncState.syncedIds]);

  const pendingCount =
    pendingItems.workouts.length + pendingItems.runs.length + pendingItems.sessions.length;

  const runSync = useCallback(async () => {
    if (!adapter || syncingRef.current) return;
    if (status !== 'available' || !syncState.connected) return;
    if (!historyLoaded || !runsLoaded || !hybridSessionsLoaded || !healthLoaded) return;

    const { workouts, runs: pendingRuns, sessions } = pendingItems;
    if (workouts.length + pendingRuns.length + sessions.length === 0) return;

    syncingRef.current = true;
    const newlySynced: string[] = [];
    try {
      for (const workout of workouts) {
        if (await adapter.writeStrengthWorkout(workout)) newlySynced.push(workout.id);
      }
      for (const run of pendingRuns) {
        if (await adapter.writeRun(run)) newlySynced.push(run.id);
      }
      for (const session of sessions) {
        if (await adapter.writeHybridSession(session)) newlySynced.push(session.id);
      }
    } finally {
      syncingRef.current = false;
    }

    if (newlySynced.length > 0) {
      setSyncState((current) => ({
        ...current,
        syncedIds: [...current.syncedIds, ...newlySynced],
        lastSyncAt: new Date().toISOString(),
      }));
    }
  }, [
    adapter,
    status,
    syncState.connected,
    historyLoaded,
    runsLoaded,
    hybridSessionsLoaded,
    healthLoaded,
    pendingItems,
  ]);

  // Auto-sync whenever new unsynced items appear while connected.
  useEffect(() => {
    runSync();
  }, [runSync]);

  const connect = useCallback(async () => {
    if (!adapter || status !== 'available') return false;
    const granted = await adapter.requestPermissions();
    if (granted) {
      setSyncState((current) => ({ ...current, connected: true }));
    }
    return granted;
  }, [adapter, status]);

  const disconnect = useCallback(() => {
    setSyncState((current) => ({ ...current, connected: false }));
  }, []);

  const updateSettings = useCallback((patch: Partial<HealthSyncSettings>) => {
    setSyncState((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
    }));
  }, []);

  const value = useMemo<HealthContextValue>(
    () => ({
      status,
      providerName: adapter?.providerName ?? 'Health',
      connected: syncState.connected,
      settings: syncState.settings,
      syncedCount: syncState.syncedIds.length,
      pendingCount,
      lastSyncAt: syncState.lastSyncAt,
      healthLoaded,
      connect,
      disconnect,
      updateSettings,
      syncNow: runSync,
    }),
    [
      status,
      adapter,
      syncState.connected,
      syncState.settings,
      syncState.syncedIds.length,
      syncState.lastSyncAt,
      pendingCount,
      healthLoaded,
      connect,
      disconnect,
      updateSettings,
      runSync,
    ]
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) {
    throw new Error('useHealth must be used inside <HealthProvider>');
  }
  return ctx;
}
