import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActivityFeedItem, ActivityFeedRoute, ActivityFeedType } from '../types';
import { useWorkout } from './WorkoutContext';
import { useRuns } from './RunContext';
import { useHybridSessions } from './HybridContext';
import { buildActivityFeed } from '../utils/activityFeed';

const ACTIVITY_FEED_STORAGE_KEY = 'revivex.activityFeed.v1';

interface ActivityFeedContextValue {
  activityFeed: ActivityFeedItem[];
  activityFeedLoaded: boolean;
  rebuildActivityFeed: () => ActivityFeedItem[];
  getActivityBySource: (
    type: ActivityFeedType,
    sourceId: string
  ) => ActivityFeedItem | undefined;
}

const ActivityFeedContext = createContext<ActivityFeedContextValue | undefined>(undefined);

function isActivityType(value: unknown): value is ActivityFeedType {
  return value === 'workout' || value === 'run' || value === 'hybrid';
}

function getRoute(type: ActivityFeedType, sourceId: string): ActivityFeedRoute {
  if (type === 'workout') return { pathname: '/workout/[id]', params: { id: sourceId } };
  if (type === 'run') return { pathname: '/run/[id]', params: { id: sourceId } };
  return { pathname: '/hybrid/[id]', params: { id: sourceId } };
}

function normalizePersistedActivity(value: unknown): ActivityFeedItem | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<ActivityFeedItem>;
  if (!candidate.sourceId || typeof candidate.sourceId !== 'string') return null;
  if (!isActivityType(candidate.type)) return null;

  const timestamp = Number(candidate.timestamp);
  if (!Number.isFinite(timestamp)) return null;

  return {
    id: candidate.id || `${candidate.type}-${candidate.sourceId}`,
    sourceId: candidate.sourceId,
    type: candidate.type,
    title: candidate.title?.trim() || 'Activity',
    date: candidate.date || new Date(timestamp).toISOString(),
    dateLabel: candidate.dateLabel || 'Unknown date',
    subtitle: candidate.subtitle || '',
    stats: Array.isArray(candidate.stats) ? candidate.stats : [],
    chipLabel: candidate.chipLabel || candidate.type,
    route: getRoute(candidate.type, candidate.sourceId),
    createdAt: candidate.createdAt,
    timestamp,
  };
}

function normalizePersistedFeed(raw: string | null): ActivityFeedItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizePersistedActivity)
      .filter((item): item is ActivityFeedItem => Boolean(item))
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function ActivityFeedProvider({ children }: { children: React.ReactNode }) {
  const { history, historyLoaded } = useWorkout();
  const { runs, runsLoaded } = useRuns();
  const { hybridSessions, hybridSessionsLoaded } = useHybridSessions();
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [activityFeedLoaded, setActivityFeedLoaded] = useState(false);

  const derivedFeed = useMemo(
    () => buildActivityFeed(history, runs, hybridSessions),
    [history, runs, hybridSessions]
  );
  const sourceDataLoaded = historyLoaded && runsLoaded && hybridSessionsLoaded;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ACTIVITY_FEED_STORAGE_KEY);
        setActivityFeed(normalizePersistedFeed(raw));
      } catch (err) {
        console.warn('Failed to load activity feed:', err);
        setActivityFeed([]);
      } finally {
        setActivityFeedLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activityFeedLoaded || !sourceDataLoaded) return;

    setActivityFeed(derivedFeed);
    AsyncStorage.setItem(ACTIVITY_FEED_STORAGE_KEY, JSON.stringify(derivedFeed)).catch((err) =>
      console.warn('Failed to save activity feed:', err)
    );
  }, [activityFeedLoaded, derivedFeed, sourceDataLoaded]);

  const rebuildActivityFeed = useCallback(() => {
    setActivityFeed(derivedFeed);
    AsyncStorage.setItem(ACTIVITY_FEED_STORAGE_KEY, JSON.stringify(derivedFeed)).catch((err) =>
      console.warn('Failed to save activity feed:', err)
    );
    return derivedFeed;
  }, [derivedFeed]);

  const getActivityBySource = useCallback(
    (type: ActivityFeedType, sourceId: string) =>
      activityFeed.find((item) => item.type === type && item.sourceId === sourceId),
    [activityFeed]
  );

  const value = useMemo<ActivityFeedContextValue>(
    () => ({
      activityFeed,
      activityFeedLoaded,
      rebuildActivityFeed,
      getActivityBySource,
    }),
    [activityFeed, activityFeedLoaded, rebuildActivityFeed, getActivityBySource]
  );

  return <ActivityFeedContext.Provider value={value}>{children}</ActivityFeedContext.Provider>;
}

export function useActivityFeed(): ActivityFeedContextValue {
  const ctx = useContext(ActivityFeedContext);
  if (!ctx) {
    throw new Error('useActivityFeed must be used inside <ActivityFeedProvider>');
  }
  return ctx;
}
