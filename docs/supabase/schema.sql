-- ReviveX Social schema (Phase 39+)
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to run once on a fresh project.

-- ============ Profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null
    check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by everyone"
  on public.profiles for select using (true);
create policy "users insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "users update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============ Posts (shared activities) ============
-- One row per activity a user chooses to share. Payload mirrors the local
-- activity shape (title, stats, exercise summary, splits, route points).
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  activity_type text not null check (activity_type in ('workout', 'run', 'hybrid')),
  title text not null default '',
  caption text not null default '',
  stats jsonb not null default '{}'::jsonb,      -- {durationSeconds, volume, distance, ...}
  details jsonb not null default '{}'::jsonb,    -- exercises summary / splits / routePoints
  created_at timestamptz not null default now()
);

create index if not exists posts_author_created on public.posts (author_id, created_at desc);
create index if not exists posts_created on public.posts (created_at desc);

alter table public.posts enable row level security;

create policy "posts are readable by everyone"
  on public.posts for select using (true);
create policy "users insert their own posts"
  on public.posts for insert with check (auth.uid() = author_id);
create policy "users delete their own posts"
  on public.posts for delete using (auth.uid() = author_id);

-- ============ Follows ============
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

create policy "follows are readable by everyone"
  on public.follows for select using (true);
create policy "users follow as themselves"
  on public.follows for insert with check (auth.uid() = follower_id);
create policy "users unfollow as themselves"
  on public.follows for delete using (auth.uid() = follower_id);

-- ============ Likes ============
create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.likes enable row level security;

create policy "likes are readable by everyone"
  on public.likes for select using (true);
create policy "users like as themselves"
  on public.likes for insert with check (auth.uid() = user_id);
create policy "users unlike as themselves"
  on public.likes for delete using (auth.uid() = user_id);

-- ============ Comments ============
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_created on public.comments (post_id, created_at);

alter table public.comments enable row level security;

create policy "comments are readable by everyone"
  on public.comments for select using (true);
create policy "users comment as themselves"
  on public.comments for insert with check (auth.uid() = author_id);
create policy "users delete their own comments"
  on public.comments for delete using (auth.uid() = author_id);
