-- =============================================================================
-- Revive X shared database schema (Supabase Postgres)
-- =============================================================================
-- Serves both product directions from one backend:
--   Direction A (hybrid tracker): training tables, social tables, Strava push.
--   Direction B (daily coach):    training tables, readiness check-ins, daily plans.
--
-- Rules this file follows:
--   * Row-level security is enabled on every table. Default access is owner-only.
--   * Nothing is readable anonymously. Policies are granted to `authenticated`.
--   * Server-only tables (Strava tokens, OAuth state) have no client policies and
--     have their privileges revoked from anon/authenticated. Only Edge Functions
--     using the service role touch them.
--   * Route points live in their own owner-only table and can never enter a post.
--   * Idempotent: safe to re-run in the Supabase SQL editor.
--
-- Local policy tests: `npm run test:db` (db/tests/rls.test.ts, runs in PGlite).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Enumerations
-- -----------------------------------------------------------------------------
do $$ begin create type public.activity_kind as enum ('workout', 'run', 'hybrid'); exception when duplicate_object then null; end $$;
do $$ begin create type public.post_visibility as enum ('private', 'followers', 'public'); exception when duplicate_object then null; end $$;
do $$ begin create type public.follow_status as enum ('pending', 'accepted'); exception when duplicate_object then null; end $$;
do $$ begin create type public.plan_kind as enum ('lift', 'run', 'hybrid', 'recovery', 'rest'); exception when duplicate_object then null; end $$;
do $$ begin create type public.plan_status as enum ('planned', 'completed', 'skipped'); exception when duplicate_object then null; end $$;
do $$ begin create type public.strava_push_status as enum ('queued', 'uploading', 'processing', 'done', 'failed', 'duplicate'); exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Creates the private profile row the moment an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: private settings and identity. Owner-only.
-- Other users see a reduced identity through the athlete_profiles view below.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '',
  bio text not null default '' check (char_length(bio) <= 280),
  avatar_url text,
  training_focus text not null default 'Hybrid',
  primary_goal text not null default 'General Fitness',
  experience_level text not null default 'Beginner',
  weekly_training_target smallint not null default 3 check (weekly_training_target between 1 and 14),
  preferred_weight_unit text not null default 'lb' check (preferred_weight_unit in ('lb', 'kg')),
  preferred_distance_unit text not null default 'mi' check (preferred_distance_unit in ('mi', 'km')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Private per-user profile and preferences. Owner-only. Public identity is exposed through athlete_profiles.';

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Reduced public identity. Definer view on purpose: it exposes exactly these
-- four columns to signed-in users and nothing else from profiles.
drop view if exists public.athlete_profiles;
create view public.athlete_profiles with (security_invoker = false) as
  select id, username, display_name, avatar_url
  from public.profiles
  where username is not null;
revoke all on public.athlete_profiles from anon;
grant select on public.athlete_profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Training data (shared by both directions). Owner-only.
-- client_id is the device-generated id, so devices can upsert idempotently.
-- -----------------------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null,
  title text not null default '',
  performed_at timestamptz not null,
  started_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  total_sets integer not null default 0 check (total_sets >= 0),
  total_volume numeric(12, 2) not null default 0 check (total_volume >= 0),
  notes text,
  source text not null default 'manual' check (source in ('manual', 'routine', 'import', 'coach')),
  exercises jsonb not null default '[]'::jsonb check (jsonb_typeof(exercises) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);
comment on table public.workouts is 'Strength sessions. exercises holds the WorkoutExercise[] shape from @revivex/core.';
create index if not exists workouts_user_performed on public.workouts (user_id, performed_at desc);

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null,
  title text not null default '',
  performed_at timestamptz not null,
  distance_m numeric(10, 2) not null check (distance_m >= 0),
  distance_unit text not null default 'mi' check (distance_unit in ('mi', 'km')),
  duration_seconds integer not null check (duration_seconds >= 0),
  run_type text not null default 'Outdoor',
  location text,
  notes text,
  source text not null default 'manual' check (source in ('manual', 'gps', 'imported')),
  splits jsonb not null default '[]'::jsonb check (jsonb_typeof(splits) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);
comment on table public.runs is 'Runs without their GPS trace. Route points live in run_routes.';
create index if not exists runs_user_performed on public.runs (user_id, performed_at desc);

create table if not exists public.run_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- The device id of the run this trace belongs to (runs.client_id).
  client_id text not null,
  points jsonb not null default '[]'::jsonb check (jsonb_typeof(points) = 'array'),
  point_count integer not null default 0 check (point_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);
comment on table public.run_routes is 'GPS traces, keyed by the run device id. Owner-only, never joined into posts. Masking happens before any sharing.';
create index if not exists run_routes_user on public.run_routes (user_id);

create table if not exists public.hybrid_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null,
  title text not null default '',
  performed_at timestamptz not null,
  session_type text not null default 'Custom Hybrid',
  total_duration_seconds integer not null default 0 check (total_duration_seconds >= 0),
  notes text,
  segments jsonb not null default '[]'::jsonb check (jsonb_typeof(segments) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);
comment on table public.hybrid_sessions is 'Hybrid and HYROX sessions. segments holds the HybridSegment[] shape from @revivex/core.';
create index if not exists hybrid_sessions_user_performed on public.hybrid_sessions (user_id, performed_at desc);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null,
  name text not null,
  description text,
  goal text,
  exercises jsonb not null default '[]'::jsonb check (jsonb_typeof(exercises) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);
create index if not exists routines_user_updated on public.routines (user_id, updated_at desc);

create table if not exists public.body_weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null,
  measured_at timestamptz not null,
  weight numeric(6, 2) not null check (weight > 0),
  unit text not null check (unit in ('lb', 'kg')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);
create index if not exists body_weight_user_measured on public.body_weight_entries (user_id, measured_at desc);

create table if not exists public.exercise_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null,
  name text not null check (char_length(name) between 1 and 80),
  muscle_group text not null,
  equipment text,
  exercise_type text not null default 'weight_reps'
    check (exercise_type in ('weight_reps', 'reps_only', 'bodyweight_reps', 'duration', 'distance_duration')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);
comment on table public.exercise_templates is 'User-created exercises. The built-in library ships in @revivex/core, not in the database.';
create index if not exists exercise_templates_user on public.exercise_templates (user_id, name);

-- Owner-only policies for every training table.
do $$
declare t text;
begin
  foreach t in array array['workouts', 'runs', 'run_routes', 'hybrid_sessions', 'routines', 'body_weight_entries', 'exercise_templates']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t || '_delete_own', t);
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Social (Direction A). Visibility-aware, signed-in users only.
-- -----------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  status public.follow_status not null default 'accepted',
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists follows_followee_status on public.follows (followee_id, status);

alter table public.follows enable row level security;
drop policy if exists "follows_select_party" on public.follows;
create policy "follows_select_party" on public.follows for select to authenticated
  using ((select auth.uid()) in (follower_id, followee_id));
drop policy if exists "follows_insert_as_follower" on public.follows;
create policy "follows_insert_as_follower" on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()));
drop policy if exists "follows_update_as_followee" on public.follows;
create policy "follows_update_as_followee" on public.follows for update to authenticated
  using (followee_id = (select auth.uid())) with check (followee_id = (select auth.uid()));
drop policy if exists "follows_delete_party" on public.follows;
create policy "follows_delete_party" on public.follows for delete to authenticated
  using ((select auth.uid()) in (follower_id, followee_id));

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  activity_kind public.activity_kind not null,
  activity_client_id text,
  title text not null default '' check (char_length(title) <= 120),
  caption text not null default '' check (char_length(caption) <= 1000),
  visibility public.post_visibility not null default 'followers',
  -- Summary numbers only: duration, volume, distance, pace. Never coordinates.
  stats jsonb not null default '{}'::jsonb check (jsonb_typeof(stats) = 'object'),
  -- Exercise summary, splits, segment list. Route points are rejected outright.
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object' and not (details ? 'routePoints') and not (details ? 'route_points') and not (details ? 'points')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.posts is 'Shared activities. Visible to the author, to accepted followers when visibility = followers, to all signed-in users when public.';
create index if not exists posts_author_created on public.posts (author_id, created_at desc);
create index if not exists posts_public_created on public.posts (created_at desc) where visibility = 'public';

alter table public.posts enable row level security;
drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible" on public.posts for select to authenticated
  using (
    author_id = (select auth.uid())
    or visibility = 'public'
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows f
        where f.follower_id = (select auth.uid())
          and f.followee_id = posts.author_id
          and f.status = 'accepted'
      )
    )
  );
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete to authenticated using (author_id = (select auth.uid()));
drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts for each row execute function public.set_updated_at();

-- True when the calling user is allowed to see the post. Runs with the caller's
-- rights, so it inherits posts_select_visible instead of duplicating it.
create or replace function public.can_view_post(p_post_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (select 1 from public.posts p where p.id = p_post_id);
$$;

create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists likes_user on public.likes (user_id);

alter table public.likes enable row level security;
drop policy if exists "likes_select_visible_post" on public.likes;
create policy "likes_select_visible_post" on public.likes for select to authenticated using (public.can_view_post(post_id));
drop policy if exists "likes_insert_own_visible_post" on public.likes;
create policy "likes_insert_own_visible_post" on public.likes for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_view_post(post_id));
drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own" on public.likes for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_created on public.comments (post_id, created_at);

alter table public.comments enable row level security;
drop policy if exists "comments_select_visible_post" on public.comments;
create policy "comments_select_visible_post" on public.comments for select to authenticated using (public.can_view_post(post_id));
drop policy if exists "comments_insert_own_visible_post" on public.comments;
create policy "comments_insert_own_visible_post" on public.comments for insert to authenticated
  with check (author_id = (select auth.uid()) and public.can_view_post(post_id));
drop policy if exists "comments_delete_own_or_post_author" on public.comments;
create policy "comments_delete_own_or_post_author" on public.comments for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (select 1 from public.posts p where p.id = comments.post_id and p.author_id = (select auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- Strava (Direction A). Push-first. Tokens never reach the client.
-- -----------------------------------------------------------------------------
create table if not exists public.strava_connections (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  athlete_id bigint not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text not null default '',
  connected_at timestamptz not null default now(),
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);
comment on table public.strava_connections is 'Server-only. Written and read exclusively by Edge Functions with the service role. Move token columns to Supabase Vault before public beta.';
alter table public.strava_connections enable row level security;
revoke all on public.strava_connections from anon, authenticated;
drop trigger if exists strava_connections_set_updated_at on public.strava_connections;
create trigger strava_connections_set_updated_at before update on public.strava_connections for each row execute function public.set_updated_at();

-- What the app may know about its own connection: identity and status, no tokens.
drop view if exists public.strava_connection_status;
create view public.strava_connection_status with (security_invoker = false) as
  select user_id, athlete_id, scope, connected_at, revoked_at
  from public.strava_connections
  where user_id = (select auth.uid());
revoke all on public.strava_connection_status from anon;
grant select on public.strava_connection_status to authenticated;

create table if not exists public.strava_oauth_states (
  state text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  return_to text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes'
);
comment on table public.strava_oauth_states is 'Server-only CSRF state for the Strava OAuth round trip.';
alter table public.strava_oauth_states enable row level security;
revoke all on public.strava_oauth_states from anon, authenticated;
create index if not exists strava_oauth_states_expires on public.strava_oauth_states (expires_at);

create table if not exists public.strava_pushes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_kind public.activity_kind not null,
  activity_client_id text not null,
  status public.strava_push_status not null default 'queued',
  strava_upload_id bigint,
  strava_activity_id bigint,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, activity_kind, activity_client_id)
);
comment on table public.strava_pushes is 'Outbox for activities the user asked to post to Strava. Clients enqueue; the Edge Function worker advances status.';
create index if not exists strava_pushes_worker on public.strava_pushes (status, created_at) where status in ('queued', 'uploading', 'processing');
create index if not exists strava_pushes_user on public.strava_pushes (user_id, created_at desc);

alter table public.strava_pushes enable row level security;
drop policy if exists "strava_pushes_select_own" on public.strava_pushes;
create policy "strava_pushes_select_own" on public.strava_pushes for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "strava_pushes_enqueue_own" on public.strava_pushes;
create policy "strava_pushes_enqueue_own" on public.strava_pushes for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'queued' and strava_upload_id is null and strava_activity_id is null);
drop policy if exists "strava_pushes_cancel_queued_own" on public.strava_pushes;
create policy "strava_pushes_cancel_queued_own" on public.strava_pushes for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'queued');
drop trigger if exists strava_pushes_set_updated_at on public.strava_pushes;
create trigger strava_pushes_set_updated_at before update on public.strava_pushes for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Daily coach (Direction B). Owner-only.
-- -----------------------------------------------------------------------------
create table if not exists public.readiness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null,
  checkin_date date not null,
  sleep smallint not null check (sleep between 1 and 5),
  soreness smallint not null check (soreness between 1 and 5),
  energy smallint not null check (energy between 1 and 5),
  score smallint not null check (score between 0 and 100),
  notes text check (char_length(notes) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id),
  unique (user_id, checkin_date)
);
comment on table public.readiness_checkins is 'Three-tap daily check-in. score is computed by the rules engine in @revivex/core and stored for history.';

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null,
  plan_date date not null,
  kind public.plan_kind not null,
  title text not null default '',
  engine_version text not null,
  -- Device id of the readiness check-in that shaped this plan, if any.
  checkin_client_id text,
  plan jsonb not null default '{}'::jsonb check (jsonb_typeof(plan) = 'object'),
  status public.plan_status not null default 'planned',
  completed_activity_kind public.activity_kind,
  completed_activity_client_id text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id),
  unique (user_id, plan_date),
  check ((status = 'completed') = (completed_at is not null))
);
comment on table public.daily_plans is 'One generated session per user per day. plan holds blocks, prescriptions and the rationale lines shown to the user.';
create index if not exists daily_plans_user_date on public.daily_plans (user_id, plan_date desc);

do $$
declare t text;
begin
  foreach t in array array['readiness_checkins', 'daily_plans']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t || '_delete_own', t);
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end $$;
