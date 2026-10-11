/**
 * Row-level security tests for db/schema.sql.
 *
 * Runs the real schema inside PGlite (Postgres compiled to WASM), with a stub
 * `auth` schema that mimics Supabase: auth.users, auth.uid(), and the roles
 * anon / authenticated / service_role. Each check runs as a specific user by
 * switching role and setting the JWT subject for one transaction.
 *
 * Usage: npm run test:db
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite, type Transaction } from '@electric-sql/pglite';
import { check, checkTrue, report, suite } from '@revivex/test-utils';

const here = dirname(fileURLToPath(import.meta.url));
const schemaSql = readFileSync(join(here, '..', 'schema.sql'), 'utf8');

const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';
const CAROL = '33333333-3333-4333-8333-333333333333';

type Actor = { kind: 'user'; id: string } | { kind: 'anon' } | { kind: 'service' };

async function main(): Promise<number> {
  const db = new PGlite();

  // Supabase-like environment.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
    create schema auth;
    create table auth.users (
      id uuid primary key,
      email text,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);

  await db.exec(schemaSql);
  // Re-run once to prove idempotency.
  await db.exec(schemaSql);

  async function run<T>(actor: Actor, fn: (tx: Transaction) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      if (actor.kind === 'user') {
        await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [actor.id]);
        await tx.exec('set local role authenticated');
      } else if (actor.kind === 'anon') {
        await tx.query(`select set_config('request.jwt.claim.sub', '', true)`);
        await tx.exec('set local role anon');
      } else {
        await tx.exec('set local role service_role');
      }
      return fn(tx);
    });
  }

  async function fails(actor: Actor, sql: string, params: unknown[] = []): Promise<string | null> {
    try {
      await run(actor, (tx) => tx.query(sql, params));
      return null;
    } catch (error) {
      return (error as Error).message;
    }
  }

  async function rows<T = Record<string, unknown>>(actor: Actor, sql: string, params: unknown[] = []): Promise<T[]> {
    return run(actor, async (tx) => (await tx.query<T>(sql, params)).rows);
  }

  const alice = { kind: 'user', id: ALICE } as const;
  const bob = { kind: 'user', id: BOB } as const;
  const carol = { kind: 'user', id: CAROL } as const;
  const anon = { kind: 'anon' } as const;
  const service = { kind: 'service' } as const;

  suite('profiles');
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${ALICE}', 'alice@example.com', '{"display_name":"Alice"}'),
      ('${BOB}', 'bob@example.com', '{}'),
      ('${CAROL}', 'carol@example.com', '{}');
  `);
  const profiles = await rows(service, 'select id, display_name from public.profiles order by id');
  check('auth trigger creates one profile per user', profiles.length, 3);
  check('display name copied from metadata', profiles[0].display_name, 'Alice');
  check('owner reads own profile', (await rows(alice, 'select id from public.profiles')).length, 1);
  check('other user cannot read profiles directly', (await rows(bob, `select id from public.profiles where id = $1`, [ALICE])).length, 0);
  await run(alice, (tx) => tx.query(`update public.profiles set username = 'alice_lifts' where id = $1`, [ALICE]));
  check('bad username rejected by check', (await fails(alice, `update public.profiles set username = 'Al' where id = $1`, [ALICE])) !== null, true);
  const card = await rows(bob, `select username, display_name from public.athlete_profiles where id = $1`, [ALICE]);
  check('athlete_profiles exposes identity to signed-in users', card, [{ username: 'alice_lifts', display_name: 'Alice' }]);
  check('athlete_profiles hides users without a username', (await rows(alice, `select id from public.athlete_profiles where id = $1`, [BOB])).length, 0);
  check('anon cannot read athlete_profiles', (await fails(anon, 'select * from public.athlete_profiles')) !== null, true);
  check('user cannot impersonate another profile update', (await rows(bob, `update public.profiles set display_name = 'hacked' where id = $1 returning id`, [ALICE])).length, 0);

  suite('training tables are owner-only');
  await run(alice, (tx) =>
    tx.query(
      `insert into public.workouts (user_id, client_id, title, performed_at, exercises) values ($1, 'wk_1', 'Push', now(), '[{"exerciseId":"bench-press"}]')`,
      [ALICE]
    )
  );
  check('owner sees own workout', (await rows(alice, 'select title from public.workouts')).length, 1);
  check('other user sees nothing', (await rows(bob, 'select title from public.workouts')).length, 0);
  check('anon sees nothing', (await fails(anon, 'select title from public.workouts')) !== null || (await rows(anon, 'select title from public.workouts')).length === 0, true);
  check('cannot insert for another user', (await fails(bob, `insert into public.workouts (user_id, client_id, performed_at) values ($1, 'wk_x', now())`, [ALICE])) !== null, true);
  check('cannot update another user row', (await rows(bob, `update public.workouts set title = 'owned' where user_id = $1 returning id`, [ALICE])).length, 0);
  check('cannot delete another user row', (await rows(bob, `delete from public.workouts where user_id = $1 returning id`, [ALICE])).length, 0);
  check('upsert by client id is idempotent', (await fails(alice, `insert into public.workouts (user_id, client_id, performed_at) values ($1, 'wk_1', now()) on conflict (user_id, client_id) do update set title = 'Push day'`, [ALICE])), null);
  check('still one workout after upsert', (await rows(alice, 'select title from public.workouts')), [{ title: 'Push day' }]);
  const before = await rows<{ updated_at: string }>(alice, 'select updated_at from public.workouts');
  await new Promise((resolve) => setTimeout(resolve, 5));
  await run(alice, (tx) => tx.query(`update public.workouts set notes = 'felt strong'`));
  const after = await rows<{ updated_at: string }>(alice, 'select updated_at from public.workouts');
  checkTrue('updated_at trigger advances on update', new Date(after[0].updated_at).getTime() > new Date(before[0].updated_at).getTime());
  check('exercises must be a json array', (await fails(alice, `insert into public.workouts (user_id, client_id, performed_at, exercises) values ($1, 'wk_bad', now(), '{"a":1}')`, [ALICE])) !== null, true);

  const run1 = await rows<{ id: string }>(alice, `insert into public.runs (user_id, client_id, performed_at, distance_m, duration_seconds, source) values ($1, 'run_1', now(), 5000, 1500, 'gps') returning id`, [ALICE]);
  await run(alice, (tx) => tx.query(`insert into public.run_routes (user_id, client_id, points, point_count) values ($1, 'run_1', '[{"lat":1,"lng":2,"t":3}]', 1)`, [ALICE]));
  check('route cannot be written for another user', (await fails(bob, `insert into public.run_routes (user_id, client_id, points, point_count) values ($1, 'run_1', '[]', 0)`, [ALICE])) !== null, true);
  check('route owner reads route', (await rows(alice, 'select point_count from public.run_routes')).length, 1);
  check('other user cannot read route', (await rows(bob, 'select point_count from public.run_routes')).length, 0);
  check('negative distance rejected', (await fails(alice, `insert into public.runs (user_id, client_id, performed_at, distance_m, duration_seconds) values ($1, 'run_bad', now(), -1, 10)`, [ALICE])) !== null, true);

  suite('posts and visibility');
  const post = async (actor: typeof alice, visibility: string, title: string) =>
    (await rows<{ id: string }>(actor, `insert into public.posts (author_id, activity_kind, title, visibility) values ($1, 'workout', $2, $3) returning id`, [actor.id, title, visibility]))[0].id;
  const privatePost = await post(alice, 'private', 'private');
  const followersPost = await post(alice, 'followers', 'followers');
  const publicPost = await post(alice, 'public', 'public');
  check('author sees all own posts', (await rows(alice, 'select id from public.posts')).length, 3);
  check('stranger sees only public post', (await rows(bob, 'select title from public.posts order by title')), [{ title: 'public' }]);
  // Bob requests to follow Alice; pending until Alice accepts.
  await run(bob, (tx) => tx.query(`insert into public.follows (follower_id, followee_id, status) values ($1, $2, 'pending')`, [BOB, ALICE]));
  check('pending follower still sees only public post', (await rows(bob, 'select title from public.posts order by title')), [{ title: 'public' }]);
  check('stranger cannot accept a follow for someone else', (await rows(carol, `update public.follows set status = 'accepted' where follower_id = $1 returning follower_id`, [BOB])).length, 0);
  check('follower cannot self-accept', (await rows(bob, `update public.follows set status = 'accepted' where follower_id = $1 returning follower_id`, [BOB])).length, 0);
  await run(alice, (tx) => tx.query(`update public.follows set status = 'accepted' where follower_id = $1 and followee_id = $2`, [BOB, ALICE]));
  check('accepted follower sees followers and public posts', (await rows(bob, 'select title from public.posts order by title')), [{ title: 'followers' }, { title: 'public' }]);
  check('accepted follower never sees private post', (await rows(bob, `select id from public.posts where id = $1`, [privatePost])).length, 0);
  check('third party cannot read the follow row', (await rows(carol, 'select follower_id from public.follows')).length, 0);
  check('cannot follow as someone else', (await fails(carol, `insert into public.follows (follower_id, followee_id) values ($1, $2)`, [BOB, CAROL])) !== null, true);
  check('cannot follow yourself', (await fails(carol, `insert into public.follows (follower_id, followee_id) values ($1, $1)`, [CAROL])) !== null, true);
  check('route points rejected in post details', (await fails(alice, `insert into public.posts (author_id, activity_kind, details) values ($1, 'run', '{"routePoints":[]}')`, [ALICE])) !== null, true);
  check('snake case route points rejected too', (await fails(alice, `insert into public.posts (author_id, activity_kind, details) values ($1, 'run', '{"route_points":[]}')`, [ALICE])) !== null, true);
  check('cannot post as another user', (await fails(bob, `insert into public.posts (author_id, activity_kind) values ($1, 'run')`, [ALICE])) !== null, true);
  check('anon cannot read public posts', (await fails(anon, 'select id from public.posts')) !== null || (await rows(anon, 'select id from public.posts')).length === 0, true);

  suite('likes and comments inherit post visibility');
  check('follower can like followers post', await fails(bob, `insert into public.likes (post_id, user_id) values ($1, $2)`, [followersPost, BOB]), null);
  check('stranger cannot like followers post', (await fails(carol, `insert into public.likes (post_id, user_id) values ($1, $2)`, [followersPost, CAROL])) !== null, true);
  check('stranger can like public post', await fails(carol, `insert into public.likes (post_id, user_id) values ($1, $2)`, [publicPost, CAROL]), null);
  check('cannot like as someone else', (await fails(carol, `insert into public.likes (post_id, user_id) values ($1, $2)`, [publicPost, BOB])) !== null, true);
  check('stranger cannot see likes on followers post', (await rows(carol, `select user_id from public.likes where post_id = $1`, [followersPost])).length, 0);
  check('author sees likes on own followers post', (await rows(alice, `select user_id from public.likes where post_id = $1`, [followersPost])).length, 1);
  check('stranger cannot comment on followers post', (await fails(carol, `insert into public.comments (post_id, author_id, body) values ($1, $2, 'nice')`, [followersPost, CAROL])) !== null, true);
  const comment = await rows<{ id: string }>(bob, `insert into public.comments (post_id, author_id, body) values ($1, $2, 'strong work') returning id`, [followersPost, BOB]);
  check('empty comment rejected', (await fails(bob, `insert into public.comments (post_id, author_id, body) values ($1, $2, '')`, [followersPost, BOB])) !== null, true);
  check('third party cannot delete a comment', (await rows(carol, `delete from public.comments where id = $1 returning id`, [comment[0].id])).length, 0);
  check('post author can delete a comment on their post', (await rows(alice, `delete from public.comments where id = $1 returning id`, [comment[0].id])).length, 1);

  suite('strava tables');
  check('client cannot read strava_connections', (await fails(alice, 'select * from public.strava_connections')) !== null, true);
  check('client cannot write strava_connections', (await fails(alice, `insert into public.strava_connections (user_id, athlete_id, access_token, refresh_token, expires_at) values ($1, 1, 'a', 'r', now())`, [ALICE])) !== null, true);
  check('client cannot read oauth states', (await fails(alice, 'select * from public.strava_oauth_states')) !== null, true);
  await run(service, (tx) => tx.query(`insert into public.strava_connections (user_id, athlete_id, access_token, refresh_token, expires_at, scope) values ($1, 4242, 'access', 'refresh', now() + interval '6 hours', 'activity:write')`, [ALICE]));
  const status = await rows(alice, 'select athlete_id, scope from public.strava_connection_status');
  check('owner sees connection status without tokens', status, [{ athlete_id: 4242, scope: 'activity:write' }]);
  check('other user sees no connection status', (await rows(bob, 'select athlete_id from public.strava_connection_status')).length, 0);
  check('owner can enqueue a push', await fails(alice, `insert into public.strava_pushes (user_id, activity_kind, activity_client_id) values ($1, 'workout', 'wk_1')`, [ALICE]), null);
  check('duplicate push rejected', (await fails(alice, `insert into public.strava_pushes (user_id, activity_kind, activity_client_id) values ($1, 'workout', 'wk_1')`, [ALICE])) !== null, true);
  check('client cannot enqueue as done', (await fails(alice, `insert into public.strava_pushes (user_id, activity_kind, activity_client_id, status) values ($1, 'run', 'run_1', 'done')`, [ALICE])) !== null, true);
  check('client cannot advance push status', (await rows(alice, `update public.strava_pushes set status = 'done' where user_id = $1 returning id`, [ALICE])).length, 0);
  check('other user cannot see pushes', (await rows(bob, 'select id from public.strava_pushes')).length, 0);
  await run(service, (tx) => tx.query(`update public.strava_pushes set status = 'processing' where user_id = $1`, [ALICE]));
  check('owner cannot cancel once processing', (await rows(alice, `delete from public.strava_pushes where user_id = $1 returning id`, [ALICE])).length, 0);
  await run(service, (tx) => tx.query(`update public.strava_pushes set status = 'failed', error = 'boom' where user_id = $1`, [ALICE]));
  check('owner can clear a failed push to retry', (await rows(alice, `delete from public.strava_pushes where user_id = $1 returning id`, [ALICE])).length, 1);

  suite('daily coach tables');
  check('owner logs a check-in', await fails(bob, `insert into public.readiness_checkins (user_id, client_id, checkin_date, sleep, soreness, energy, score) values ($1, 'ci_1', current_date, 4, 2, 4, 78)`, [BOB]), null);
  check('second check-in same day rejected', (await fails(bob, `insert into public.readiness_checkins (user_id, client_id, checkin_date, sleep, soreness, energy, score) values ($1, 'ci_2', current_date, 3, 3, 3, 50)`, [BOB])) !== null, true);
  check('check-in upsert by device id works', await fails(bob, `insert into public.readiness_checkins (user_id, client_id, checkin_date, sleep, soreness, energy, score) values ($1, 'ci_1', current_date, 5, 2, 4, 85) on conflict (user_id, client_id) do update set sleep = excluded.sleep, score = excluded.score`, [BOB]), null);
  check('out of range sleep rejected', (await fails(bob, `insert into public.readiness_checkins (user_id, client_id, checkin_date, sleep, soreness, energy, score) values ($1, 'ci_3', current_date - 1, 6, 1, 1, 10)`, [BOB])) !== null, true);
  check('other user cannot read check-ins', (await rows(alice, 'select id from public.readiness_checkins')).length, 0);
  check('owner stores a daily plan', await fails(bob, `insert into public.daily_plans (user_id, client_id, plan_date, kind, title, engine_version, checkin_client_id, plan) values ($1, 'plan_1', current_date, 'lift', 'Upper push', 'coach-0.1', 'ci_1', '{"blocks":[]}')`, [BOB]), null);
  check('one plan per day', (await fails(bob, `insert into public.daily_plans (user_id, client_id, plan_date, kind, engine_version) values ($1, 'plan_2', current_date, 'rest', 'coach-0.1')`, [BOB])) !== null, true);
  check('completed requires completed_at', (await rows(bob, `update public.daily_plans set status = 'completed' where user_id = $1 returning id`, [BOB]).catch(() => [])).length, 0);
  check('completion with timestamp accepted', await fails(bob, `update public.daily_plans set status = 'completed', completed_at = now(), completed_activity_kind = 'workout' where user_id = $1`, [BOB]), null);
  check('other user cannot read plans', (await rows(alice, 'select id from public.daily_plans')).length, 0);

  await db.close();
  return report();
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    const err = error as { message?: string; position?: string | number };
    console.error('FATAL:', err.message ?? String(error));
    if (err.position) {
      const at = Number(err.position);
      console.error('near:', JSON.stringify(schemaSql.slice(Math.max(0, at - 200), at + 80)));
    }
    process.exit(1);
  }
);
