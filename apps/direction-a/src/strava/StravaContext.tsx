import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  disconnectStrava,
  getStravaConnectionStatus,
  listStravaPushes,
  requestStravaPush,
  startStravaConnect,
  type StravaActivityKind,
  type StravaConnectionStatus,
  type StravaPushRecord,
} from '@revivex/backend';
import { getSupabase } from '../social/supabase';
import { useSocial } from '../context/SocialContext';
import { useSync } from '../sync/SyncContext';

/**
 * StravaContext: push-first Strava integration for Direction A.
 * Connection status comes from a view that exposes no tokens; pushes are
 * rows the user enqueues and an Edge Function drains. Nothing is pulled
 * from Strava and nothing from Strava is shown to anyone else.
 */

export type StravaStatus = 'unconfigured' | 'signedOut' | 'disconnected' | 'connected' | 'revoked';

interface StravaContextValue {
  status: StravaStatus;
  connection: StravaConnectionStatus | null;
  pushes: StravaPushRecord[];
  loading: boolean;
  refresh: () => Promise<void>;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<string | null>;
  postActivity: (kind: StravaActivityKind, clientId: string) => Promise<string>;
  pushFor: (kind: StravaActivityKind, clientId: string) => StravaPushRecord | undefined;
}

const StravaContext = createContext<StravaContextValue | undefined>(undefined);

const TABLE_FOR: Record<StravaActivityKind, 'workouts' | 'runs' | 'hybrid_sessions'> = {
  workout: 'workouts',
  run: 'runs',
  hybrid: 'hybrid_sessions',
};

export function StravaProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabase(), []);
  const { session } = useSocial();
  const sync = useSync();
  const userId = session?.user.id ?? null;
  const [connection, setConnection] = useState<StravaConnectionStatus | null>(null);
  const [pushes, setPushes] = useState<StravaPushRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const status: StravaStatus = !supabase ? 'unconfigured' : !userId ? 'signedOut' : !connection ? 'disconnected' : connection.revokedAt ? 'revoked' : 'connected';

  const refresh = useCallback(async () => {
    if (!supabase || !userId) {
      setConnection(null);
      setPushes([]);
      return;
    }
    setLoading(true);
    try {
      const [nextConnection, nextPushes] = await Promise.all([getStravaConnectionStatus(supabase), listStravaPushes(supabase, userId)]);
      setConnection(nextConnection);
      setPushes(nextPushes);
    } catch {
      // Keep the last known state; the screen shows a retry.
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [userId, refresh]);

  const connect = useCallback(async (): Promise<string | null> => {
    if (!supabase || !userId) return 'Sign in first.';
    const returnTo = Linking.createURL('/profile/strava');
    const started = await startStravaConnect(supabase, returnTo);
    if (!started.url) return started.error ?? 'Could not start the Strava connection.';
    const result = await WebBrowser.openAuthSessionAsync(started.url, returnTo);
    await refresh();
    if (result.type === 'success') {
      if (result.url.includes('strava=connected')) return null;
      const reason = /reason=([^&]+)/.exec(result.url)?.[1];
      return reason === 'scope' ? 'Strava needs permission to upload activities. Please allow it.' : `Strava connection failed (${reason ?? 'unknown'}).`;
    }
    return result.type === 'cancel' || result.type === 'dismiss' ? 'Connection cancelled.' : null;
  }, [supabase, userId, refresh]);

  const disconnect = useCallback(async (): Promise<string | null> => {
    if (!supabase) return 'Cloud is not configured.';
    const error = await disconnectStrava(supabase);
    await refresh();
    return error;
  }, [supabase, refresh]);

  const postActivity = useCallback(
    async (kind: StravaActivityKind, clientId: string): Promise<string> => {
      if (!supabase || !userId) return 'Sign in first.';
      if (status !== 'connected') return 'Connect Strava first.';
      if (sync.statusFor(TABLE_FOR[kind], clientId) !== 'synced') {
        await sync.syncNow();
      }
      const result = await requestStravaPush(supabase, userId, kind, clientId);
      await refresh();
      if (result.alreadyPosted) return 'This activity is already on Strava.';
      if (result.error) return result.error;
      const counts = result.counts;
      if (!counts) return 'Queued for Strava.';
      if (counts.done > 0) return 'Posted to Strava.';
      if (counts.duplicate > 0) return 'Strava already has an activity at this time.';
      if (counts.failed > 0) return 'Strava rejected the upload. See the Strava screen for details.';
      return 'Queued for Strava.';
    },
    [supabase, userId, status, sync, refresh]
  );

  const pushFor = useCallback(
    (kind: StravaActivityKind, clientId: string) => pushes.find((push) => push.activityKind === kind && push.activityClientId === clientId),
    [pushes]
  );

  const value = useMemo<StravaContextValue>(
    () => ({ status, connection, pushes, loading, refresh, connect, disconnect, postActivity, pushFor }),
    [status, connection, pushes, loading, refresh, connect, disconnect, postActivity, pushFor]
  );
  return <StravaContext.Provider value={value}>{children}</StravaContext.Provider>;
}

export function useStrava(): StravaContextValue {
  const ctx = useContext(StravaContext);
  if (!ctx) throw new Error('useStrava must be used inside <StravaProvider>');
  return ctx;
}
