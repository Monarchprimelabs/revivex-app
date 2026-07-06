import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../social/supabase';

/**
 * SocialContext (Phase 39)
 * Owns the cloud session and the user's cloud profile (username).
 * Status is 'unconfigured' until Supabase keys are set in app.json —
 * every social screen renders a setup notice in that state.
 */

export interface CloudProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
}

type SocialStatus = 'unconfigured' | 'loading' | 'signedOut' | 'signedIn';

interface SocialContextValue {
  status: SocialStatus;
  session: Session | null;
  cloudProfile: CloudProfile | null;
  /** Sign up / sign in with email+password. Returns an error message or null. */
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  /** Claim or update the public username/display name. Error message or null. */
  saveCloudProfile: (username: string, displayName: string) => Promise<string | null>;
}

const SocialContext = createContext<SocialContextValue | undefined>(undefined);

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabase(), []);
  const [status, setStatus] = useState<SocialStatus>(
    supabase ? 'loading' : 'unconfigured'
  );
  const [session, setSession] = useState<Session | null>(null);
  const [cloudProfile, setCloudProfile] = useState<CloudProfile | null>(null);

  const loadProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio')
        .eq('id', userId)
        .maybeSingle();
      setCloudProfile(
        data
          ? {
              id: data.id,
              username: data.username,
              displayName: data.display_name,
              bio: data.bio,
            }
          : null
      );
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus(data.session ? 'signedIn' : 'signedOut');
      if (data.session) loadProfile(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setStatus(next ? 'signedIn' : 'signedOut');
      if (next) {
        loadProfile(next.user.id);
      } else {
        setCloudProfile(null);
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase, loadProfile]);

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return 'Cloud is not configured yet.';
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      return error ? error.message : null;
    },
    [supabase]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return 'Cloud is not configured yet.';
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return error ? error.message : null;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  const saveCloudProfile = useCallback(
    async (username: string, displayName: string) => {
      if (!supabase || !session) return 'Sign in first.';

      const normalized = normalizeUsername(username);
      if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
        return 'Usernames are 3–20 characters: letters, numbers, underscores.';
      }

      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        username: normalized,
        display_name: displayName.trim(),
      });
      if (error) {
        return error.code === '23505' ? 'That username is taken.' : error.message;
      }
      await loadProfile(session.user.id);
      return null;
    },
    [supabase, session, loadProfile]
  );

  const value = useMemo<SocialContextValue>(
    () => ({
      status,
      session,
      cloudProfile,
      signUp,
      signIn,
      signOut,
      saveCloudProfile,
    }),
    [status, session, cloudProfile, signUp, signIn, signOut, saveCloudProfile]
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial(): SocialContextValue {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used inside <SocialProvider>');
  return ctx;
}
