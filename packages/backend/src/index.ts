/**
 * @revivex/backend
 * Supabase client factory, auth helpers, row mappers and the local-first sync
 * engine shared by Direction A and Direction B.
 *
 * Only the publishable anon key ever reaches a client. Service-role keys,
 * Strava secrets and user tokens live in Supabase Edge Function secrets and
 * service-role-only tables (see db/schema.sql).
 */
export * from './client';
export * from './auth';
export * from './rows';
export * from './mappers';
export * from './sync/fingerprint';
export * from './sync/state';
export * from './sync/remote';
export * from './sync/engine';
