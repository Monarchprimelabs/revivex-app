import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getAuthUser,
  onAuthUser,
  signInWithPassword,
  signOut as backendSignOut,
  signUpWithPassword,
  type AuthUser,
  type SupabaseClient,
} from '@revivex/backend';
import { getSupabase } from '../lib/supabase';

export type AuthStatus = 'unconfigured' | 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  client: SupabaseClient | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => getSupabase(), []);
  const [status, setStatus] = useState<AuthStatus>(client ? 'loading' : 'unconfigured');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    getAuthUser(client).then((current) => {
      if (cancelled) return;
      setUser(current);
      setStatus(current ? 'signedIn' : 'signedOut');
    });
    const unsubscribe = onAuthUser(client, (next) => {
      setUser(next);
      setStatus(next ? 'signedIn' : 'signedOut');
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [client]);

  const signIn = useCallback(
    (email: string, password: string) => (client ? signInWithPassword(client, email, password) : Promise.resolve('Cloud is not configured yet.')),
    [client]
  );
  const signUp = useCallback(
    (email: string, password: string, displayName?: string) =>
      client ? signUpWithPassword(client, email, password, displayName) : Promise.resolve('Cloud is not configured yet.'),
    [client]
  );
  const signOut = useCallback(() => (client ? backendSignOut(client) : Promise.resolve()), [client]);

  const value = useMemo<AuthContextValue>(() => ({ status, user, client, signIn, signUp, signOut }), [status, user, client, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
