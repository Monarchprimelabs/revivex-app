import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CreateHybridSessionInput,
  HybridSegment,
  HybridSession,
  HybridSessionType,
} from '../types';
import { calculateHybridTotalTime, getHybridSessionStats, type HybridStats } from '../utils/hybridStats';

const HYBRID_STORAGE_KEY = 'revivex.hybridSessions.v1';

interface HybridContextValue {
  hybridSessions: HybridSession[];
  hybridSessionsLoaded: boolean;
  addHybridSession: (input: CreateHybridSessionInput) => HybridSession;
  updateHybridSession: (
    sessionId: string,
    input: UpdateHybridSessionInput
  ) => HybridSession | undefined;
  deleteHybridSession: (sessionId: string) => void;
  getHybridSessionById: (sessionId: string) => HybridSession | undefined;
  getHybridSessions: () => HybridSession[];
  calculateHybridStats: () => HybridStats;
}

export interface UpdateHybridSessionInput {
  title?: string;
  date?: string;
  sessionType?: HybridSessionType;
  notes?: string;
  segments?: HybridSegment[];
}

const HybridContext = createContext<HybridContextValue | undefined>(undefined);

let _hybridIdCounter = 0;
function makeHybridId(prefix: string) {
  _hybridIdCounter += 1;
  return `${prefix}_${Date.now()}_${_hybridIdCounter}`;
}

function safeNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeSegment(
  segment: Omit<HybridSegment, 'id' | 'order'>,
  index: number
): HybridSegment {
  const durationSeconds = Math.max(0, Math.floor(safeNumber(segment.durationSeconds)));
  const distance = segment.distance === undefined ? undefined : Math.max(0, safeNumber(segment.distance));

  return {
    id: makeHybridId('hseg'),
    order: index + 1,
    name: segment.name.trim() || (segment.segmentType === 'run' ? 'Run' : 'Station'),
    segmentType: segment.segmentType,
    distance: distance && distance > 0 ? distance : undefined,
    distanceUnit: distance && distance > 0 ? segment.distanceUnit : undefined,
    durationSeconds,
    notes: segment.notes?.trim() || undefined,
  };
}

function normalizeExistingSegment(segment: HybridSegment, index: number): HybridSegment {
  const durationSeconds = Math.max(0, Math.floor(safeNumber(segment.durationSeconds)));
  const distance =
    segment.distance === undefined ? undefined : Math.max(0, safeNumber(segment.distance));

  return {
    id: segment.id || makeHybridId('hseg'),
    order: index + 1,
    name: segment.name.trim() || (segment.segmentType === 'run' ? 'Run' : 'Station'),
    segmentType: segment.segmentType,
    distance: distance && distance > 0 ? distance : undefined,
    distanceUnit: distance && distance > 0 ? segment.distanceUnit : undefined,
    durationSeconds,
    notes: segment.notes?.trim() || undefined,
  };
}

function normalizeHybridSessionInput(input: CreateHybridSessionInput): HybridSession {
  const now = new Date().toISOString();
  const date = input.date || now;
  const title = input.title?.trim() || input.sessionType;
  const segments = input.segments.map(normalizeSegment);

  return {
    id: makeHybridId('hyb'),
    title,
    date,
    sessionType: input.sessionType,
    totalDurationSeconds: calculateHybridTotalTime(segments),
    notes: input.notes?.trim() || undefined,
    segments,
    createdAt: now,
  };
}

function sortSessions(sessions: HybridSession[]): HybridSession[] {
  return [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function HybridProvider({ children }: { children: React.ReactNode }) {
  const [hybridSessions, setHybridSessions] = useState<HybridSession[]>([]);
  const [hybridSessionsLoaded, setHybridSessionsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HYBRID_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as HybridSession[];
          setHybridSessions(sortSessions(Array.isArray(parsed) ? parsed : []));
        }
      } catch (err) {
        console.warn('Failed to load hybrid sessions:', err);
      } finally {
        setHybridSessionsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hybridSessionsLoaded) return;
    AsyncStorage.setItem(HYBRID_STORAGE_KEY, JSON.stringify(hybridSessions)).catch((err) =>
      console.warn('Failed to save hybrid sessions:', err)
    );
  }, [hybridSessions, hybridSessionsLoaded]);

  const addHybridSession = useCallback((input: CreateHybridSessionInput) => {
    const session = normalizeHybridSessionInput(input);
    setHybridSessions((prev) => sortSessions([session, ...prev]));
    return session;
  }, []);

  const updateHybridSession = useCallback(
    (sessionId: string, input: UpdateHybridSessionInput) => {
      let updatedSession: HybridSession | undefined;

      setHybridSessions((prev) => {
        const next = prev.map((session) => {
          if (session.id !== sessionId) return session;

          const segments = (input.segments ?? session.segments).map(normalizeExistingSegment);
          updatedSession = {
            ...session,
            title: input.title?.trim() || session.title,
            date: input.date || session.date,
            sessionType: input.sessionType ?? session.sessionType,
            notes: input.notes !== undefined ? input.notes.trim() || undefined : session.notes,
            segments,
            totalDurationSeconds: calculateHybridTotalTime(segments),
            updatedAt: new Date().toISOString(),
          };

          return updatedSession;
        });

        return sortSessions(next);
      });

      return updatedSession;
    },
    []
  );

  const deleteHybridSession = useCallback((sessionId: string) => {
    setHybridSessions((prev) => prev.filter((session) => session.id !== sessionId));
  }, []);

  const getHybridSessionById = useCallback(
    (sessionId: string) => hybridSessions.find((session) => session.id === sessionId),
    [hybridSessions]
  );

  const getHybridSessions = useCallback(() => hybridSessions, [hybridSessions]);

  const getStats = useCallback(
    () => getHybridSessionStats(hybridSessions),
    [hybridSessions]
  );

  const value = useMemo<HybridContextValue>(
    () => ({
      hybridSessions,
      hybridSessionsLoaded,
      addHybridSession,
      updateHybridSession,
      deleteHybridSession,
      getHybridSessionById,
      getHybridSessions,
      calculateHybridStats: getStats,
    }),
    [
      hybridSessions,
      hybridSessionsLoaded,
      addHybridSession,
      updateHybridSession,
      deleteHybridSession,
      getHybridSessionById,
      getHybridSessions,
      getStats,
    ]
  );

  return <HybridContext.Provider value={value}>{children}</HybridContext.Provider>;
}

export function useHybridSessions(): HybridContextValue {
  const ctx = useContext(HybridContext);
  if (!ctx) {
    throw new Error('useHybridSessions must be used inside <HybridProvider>');
  }
  return ctx;
}
