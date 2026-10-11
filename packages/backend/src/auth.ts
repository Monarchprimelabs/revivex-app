import type { SupabaseClient } from '@supabase/supabase-js';

/** The slice of a Supabase session the apps need. */
export interface AuthUser {
  id: string;
  email: string | null;
}

function toAuthUser(user: { id: string; email?: string | null } | null | undefined): AuthUser | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

export async function getAuthUser(client: SupabaseClient): Promise<AuthUser | null> {
  const { data } = await client.auth.getSession();
  return toAuthUser(data.session?.user);
}

/** Subscribes to auth changes. Returns an unsubscribe function. */
export function onAuthUser(client: SupabaseClient, callback: (user: AuthUser | null) => void): () => void {
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(toAuthUser(session?.user));
  });
  return () => data.subscription.unsubscribe();
}

/** Returns an error message or null. */
export async function signInWithPassword(client: SupabaseClient, email: string, password: string): Promise<string | null> {
  const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  return error ? error.message : null;
}

/** Returns an error message or null. */
export async function signUpWithPassword(
  client: SupabaseClient,
  email: string,
  password: string,
  displayName?: string
): Promise<string | null> {
  const { error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: displayName ? { data: { display_name: displayName.trim() } } : undefined,
  });
  return error ? error.message : null;
}

export async function signOut(client: SupabaseClient): Promise<void> {
  await client.auth.signOut();
}

/** Human-readable email validation used by both apps before calling Supabase. */
export function validateCredentials(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
  if (password.length < 8) return 'Passwords need at least 8 characters.';
  return null;
}
