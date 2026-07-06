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
  type HealthSessionMetrics,
  type HealthSyncSettings,
  type HealthSyncState,
} from '../health/types';
import {
  mapImportedHybrid,
  mapImportedRun,
  mapImportedWorkout,
} from '../health/importMapping';
import { useWorkout } from './WorkoutContext';
import { useRuns } from './RunContext';
import { useHybridSessions } from './HybridContext';
import { useProfile } from './ProfileContext';
import { useBodyWeight } from './BodyWeightContext';

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

/** How far back the first import looks. */
const IMPORT_LOOKBACK_DAYS = 30;

type HealthStatus = 'checking' | HealthAvailability | 'no-adapter';

interface HealthContextValue {
  status: HealthStatus;
  providerName: string;
  connected: boolean;
  settings: HealthSyncSettings;
  syncedCount: number;
  pendingCount: number;
  lastSyncAt?: string;
  importedCount: number;
  lastImportAt?: string;
  importing: boolean;
  healthLoaded: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  updateSettings: (patch: Partial<HealthSyncSettings>) => void;
  syncNow: () => Promise<void>;
  /** Pull recent health-store sessions into local logs. Returns imported count. */
  importNow: () => Promise<number>;
  /** Heart rate / energy recorded during a session window, when connected. */
  getSessionMetrics: (
    dateIso: string,
    durationSeconds: number
  ) => Promise<HealthSessionMetrics | undefined>;
}

const HealthContext = createContext<HealthContextValue | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
}

export function HealthProvider({ children }: ProviderProps) {
  const adapter = useMemo(() => getHealthAdapter(), []);
  const { history, historyLoaded, importCompletedWorkout } = useWorkout();
  const { runs, runsLoaded, addRun } = useRuns();
  const { hybridSessions, hybridSessionsLoaded, addHybridSession } = useHybridSessions();
  const { profile } = useProfile();
  const { entries: bodyWeightEntries, entriesLoaded: bodyWeightLoaded } = useBodyWeight();

  const [status, setStatus] = useState<HealthStatus>('checking');
  const [syncState, setSyncState] = useState<HealthSyncState>(DEFAULT_HEALTH_SYNC_STATE);
  const [healthLoaded, setHealthLoaded] = useState(false);
  const [importing, setImporting] = useState(false);
  const syncingRef = useRef(false);
  const importingRef = useRef(false);
  const autoImportRanRef = useRef(false);

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
            importedIds: Array.isArray(parsed.importedIds) ? parsed.importedIds : [],
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
    const weights = syncState.settings.syncWeight
      ? bodyWeightEntries.filter((entry) => !synced.has(entry.id))
      : [];
    return { workouts, runs: pendingRuns, sessions, weights };
  }, [history, runs, hybridSessions, bodyWeightEntries, syncState.settings, syncState.syncedIds]);

  const pendingCount =
    pendingItems.workouts.length +
    pendingItems.runs.length +
    pendingItems.sessions.length +
    pendingItems.weights.length;

  const runSync = useCallback(async () => {
    if (!adapter || syncingRef.current || importingRef.current) return;
    if (status !== 'available' || !syncState.connected) return;
    if (!historyLoaded || !runsLoaded || !hybridSessionsLoaded || !healthLoaded) return;
    if (!bodyWeightLoaded) return;

    const { workouts, runs: pendingRuns, sessions, weights } = pendingItems;
    if (workouts.length + pendingRuns.length + sessions.length + weights.length === 0) return;

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
      for (const entry of weights) {
        if (
          await adapter.writeBodyWeight({
            weight: entry.weight,
            unit: entry.unit,
            date: entry.date,
          })
        ) {
          newlySynced.push(entry.id);
        }
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
    bodyWeightLoaded,
    healthLoaded,
    pendingItems,
  ]);

  // Auto-sync whenever new unsynced items appear while connected.
  useEffect(() => {
    runSync();
  }, [runSync]);

  const importNow = useCallback(async () => {
    if (!adapter || importingRef.current) return 0;
    if (status !== 'available' || !syncState.connected) return 0;
    if (!historyLoaded || !runsLoaded || !hybridSessionsLoaded || !healthLoaded) return 0;

    importingRef.current = true;
    setImporting(true);
    try {
      const sinceIso = new Date(
        Date.now() - IMPORT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();
      const sessions = await adapter.readRecentSessions(sinceIso);

      const known = new Set(syncState.importedIds);
      const preferredUnit = profile?.preferredDistanceUnit ?? 'mi';
      const importedExternalIds: string[] = [];
      const newLocalIds: string[] = [];

      for (const session of sessions) {
        if (known.has(session.externalId)) continue;

        if (session.kind === 'run') {
          const run = addRun(mapImportedRun(session, preferredUnit, adapter.providerName));
          newLocalIds.push(run.id);
        } else if (session.kind === 'strength') {
          const workout = importCompletedWorkout(
            mapImportedWorkout(session, adapter.providerName)
          );
          newLocalIds.push(workout.id);
        } else {
          const hybrid = addHybridSession(mapImportedHybrid(session, adapter.providerName));
          newLocalIds.push(hybrid.id);
        }
        importedExternalIds.push(session.externalId);
      }

      setSyncState((current) => ({
        ...current,
        importedIds: [...current.importedIds, ...importedExternalIds],
        // Imported items are marked as already-synced so the export engine
        // never writes them back to the health store they came from.
        syncedIds: [...current.syncedIds, ...newLocalIds],
        lastImportAt: new Date().toISOString(),
      }));

      return importedExternalIds.length;
    } finally {
      importingRef.current = false;
      setImporting(false);
    }
  }, [
    adapter,
    status,
    syncState.connected,
    syncState.importedIds,
    historyLoaded,
    runsLoaded,
    hybridSessionsLoaded,
    healthLoaded,
    profile,
    addRun,
    importCompletedWorkout,
    addHybridSession,
  ]);

  // Auto-import once per app session when connected and auto-import is on.
  useEffect(() => {
    if (autoImportRanRef.current) return;
    if (!syncState.settings.autoImport || !syncState.connected) return;
    if (status !== 'available') return;
    if (!historyLoaded || !runsLoaded || !hybridSessionsLoaded || !healthLoaded) return;

    autoImportRanRef.current = true;
    importNow();
  }, [
    importNow,
    status,
    syncState.connected,
    syncState.settings.autoImport,
    historyLoaded,
    runsLoaded,
    hybridSessionsLoaded,
    healthLoaded,
  ]);

  const connect = useCallback(async () => {
    if (!adapter || status !== 'available') return false;
    const granted = await adapter.requestPermissions();
    if (granted) {
      setSyncState((current) => ({ ...current, connected: true }));
      // Let the auto-import effect pick up the new connection immediately.
      autoImportRanRef.current = false;
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

  const getSessionMetrics = useCallback(
    async (dateIso: string, durationSeconds: number) => {
      if (!adapter || status !== 'available' || !syncState.connected) return undefined;
      return adapter.readSessionMetrics(dateIso, durationSeconds);
    },
    [adapter, status, syncState.connected]
  );

  const value = useMemo<HealthContextValue>(
    () => ({
      status,
      providerName: adapter?.providerName ?? 'Health',
      connected: syncState.connected,
      settings: syncState.settings,
      syncedCount: syncState.syncedIds.length,
      pendingCount,
      lastSyncAt: syncState.lastSyncAt,
      importedCount: syncState.importedIds.length,
      lastImportAt: syncState.lastImportAt,
      importing,
      healthLoaded,
      connect,
      disconnect,
      updateSettings,
      syncNow: runSync,
      importNow,
      getSessionMetrics,
    }),
    [
      status,
      adapter,
      syncState.connected,
      syncState.settings,
      syncState.syncedIds.length,
      syncState.lastSyncAt,
      syncState.importedIds.length,
      syncState.lastImportAt,
      importing,
      pendingCount,
      healthLoaded,
      connect,
      disconnect,
      updateSettings,
      runSync,
      importNow,
      getSessionMetrics,
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
