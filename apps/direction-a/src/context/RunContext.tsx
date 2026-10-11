import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateRunInput, RoutePoint, Run } from '@revivex/core';
import { calculatePace, calculateRunStats, type RunStats } from '@revivex/core';

const RUNS_STORAGE_KEY = 'revivex.runs.v1';

interface RunContextValue {
  runs: Run[];
  runsLoaded: boolean;
  addRun: (input: CreateRunInput) => Run;
  deleteRun: (runId: string) => void;
  /** Insert or replace runs by id (cloud sync). Local GPS traces are kept when the incoming run has none. */
  mergeRuns: (incoming: Run[]) => void;
  /** Attach cloud route points to runs that lack them. */
  mergeRunRoutes: (routes: { id: string; points: RoutePoint[] }[]) => void;
  updateRun: (runId: string, input: Partial<CreateRunInput>) => Run | undefined;
  getRunById: (runId: string) => Run | undefined;
  getRuns: () => Run[];
  calculateRunStats: () => RunStats;
}

const RunContext = createContext<RunContextValue | undefined>(undefined);

let _runIdCounter = 0;
function makeRunId() {
  _runIdCounter += 1;
  return `run_${Date.now()}_${_runIdCounter}`;
}

function normalizeRunInput(input: CreateRunInput, existing?: Run): Run {
  const now = new Date().toISOString();
  const date = input.date || existing?.date || now;
  const runType = input.runType || existing?.runType || 'Easy Run';
  const title = input.title?.trim() || existing?.title || `${runType} Run`;
  const distance = Math.max(
    0,
    Number.isFinite(input.distance) ? input.distance : existing?.distance ?? 0
  );
  const durationSeconds = Math.max(
    0,
    Math.floor(
      Number.isFinite(input.durationSeconds)
        ? input.durationSeconds
        : existing?.durationSeconds ?? 0
    )
  );
  const distanceUnit = input.distanceUnit || existing?.distanceUnit || 'mi';
  const pace = calculatePace(distance, distanceUnit, durationSeconds);
  const location =
    input.location !== undefined ? input.location.trim() || undefined : existing?.location;
  const notes = input.notes !== undefined ? input.notes.trim() || undefined : existing?.notes;

  return {
    id: existing?.id ?? makeRunId(),
    title,
    date,
    distance,
    distanceUnit,
    durationSeconds,
    paceSecondsPerMile: pace.paceSecondsPerMile,
    paceSecondsPerKm: pace.paceSecondsPerKm,
    runType,
    location,
    notes,
    source: input.source ?? existing?.source,
    splits: input.splits ?? existing?.splits,
    routePoints: input.routePoints ?? existing?.routePoints,
    createdAt: existing?.createdAt ?? now,
    updatedAt: existing ? now : undefined,
  };
}

function sortRuns(runs: Run[]): Run[] {
  return [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function RunProvider({ children }: { children: React.ReactNode }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [runsLoaded, setRunsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RUNS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Run[];
          setRuns(sortRuns(Array.isArray(parsed) ? parsed : []));
        }
      } catch (err) {
        console.warn('Failed to load runs:', err);
      } finally {
        setRunsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!runsLoaded) return;
    AsyncStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(runs)).catch((err) =>
      console.warn('Failed to save runs:', err)
    );
  }, [runs, runsLoaded]);

  const addRun = useCallback((input: CreateRunInput) => {
    const run = normalizeRunInput(input);
    setRuns((prev) => sortRuns([run, ...prev]));
    return run;
  }, []);

  const deleteRun = useCallback((runId: string) => {
    setRuns((prev) => prev.filter((run) => run.id !== runId));
  }, []);

  const mergeRuns = useCallback((incoming: Run[]) => {
    if (incoming.length === 0) return;
    setRuns((prev) => {
      const byId = new Map(prev.map((run) => [run.id, run] as const));
      for (const run of incoming) {
        const existing = byId.get(run.id);
        byId.set(run.id, run.routePoints?.length ? run : { ...run, routePoints: existing?.routePoints });
      }
      return sortRuns([...byId.values()]);
    });
  }, []);

  const mergeRunRoutes = useCallback((routes: { id: string; points: RoutePoint[] }[]) => {
    if (routes.length === 0) return;
    setRuns((prev) =>
      prev.map((run) => {
        const route = routes.find((candidate) => candidate.id === run.id);
        if (!route || (run.routePoints && run.routePoints.length > 0)) return run;
        return { ...run, routePoints: route.points };
      })
    );
  }, []);

  const updateRun = useCallback((runId: string, input: Partial<CreateRunInput>) => {
    let updatedRun: Run | undefined;
    setRuns((prev) => {
      const next = prev.map((run) => {
        if (run.id !== runId) return run;
        updatedRun = normalizeRunInput(
          {
            title: input.title ?? run.title,
            date: input.date ?? run.date,
            distance: input.distance ?? run.distance,
            distanceUnit: input.distanceUnit ?? run.distanceUnit,
            durationSeconds: input.durationSeconds ?? run.durationSeconds,
            runType: input.runType ?? run.runType,
            location: input.location ?? run.location,
            notes: input.notes ?? run.notes,
          },
          run
        );
        return updatedRun;
      });
      return sortRuns(next);
    });
    return updatedRun;
  }, []);

  const getRunById = useCallback((runId: string) => runs.find((run) => run.id === runId), [runs]);

  const getRuns = useCallback(() => runs, [runs]);

  const getStats = useCallback(() => calculateRunStats(runs), [runs]);

  const value = useMemo<RunContextValue>(
    () => ({
      runs,
      runsLoaded,
      addRun,
      deleteRun,
      mergeRuns,
      mergeRunRoutes,
      updateRun,
      getRunById,
      getRuns,
      calculateRunStats: getStats,
    }),
    [runs, runsLoaded, addRun, deleteRun, mergeRuns, mergeRunRoutes, updateRun, getRunById, getRuns, getStats]
  );

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}

export function useRuns(): RunContextValue {
  const ctx = useContext(RunContext);
  if (!ctx) {
    throw new Error('useRuns must be used inside <RunProvider>');
  }
  return ctx;
}
