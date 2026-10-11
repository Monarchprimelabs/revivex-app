# Revive X Architecture Proposal (step 2)

Status: proposed, awaiting owner approval before step 3 (vertical slices). Prepared 2026-10-11 on branch `claude/two-directions`. Companion files: `db/schema.sql` (schema, indexes, policies), `db/tests/rls.test.ts` (policy tests), `docs/features-a.md`, `docs/features-b.md`.

## 1. Decisions already made

On 2026-10-11 the owner approved the recommendations in `docs/recon.md`:

1. Direction A is restructured, not restarted.
2. Direction B is the single-screen daily coach, built as a deterministic rules engine with a three-tap readiness check-in as its input. No LLM.
3. Strava integration is push-first. Pulling Strava data into Revive X is out of scope until the full API policy text has been read.

## 2. Monorepo layout (done in this step)

```
apps/direction-a/        Existing Revive X app (Phase 50), moved as-is. Routes, storage keys, bundle id unchanged.
apps/direction-b/        Daily coach app. Scaffold only: root layout plus a Today placeholder screen.
packages/core/           @revivex/core: domain types, pure training logic, exercise library and illustrations. Node-testable, no UI.
packages/design-system/  @revivex/design-system: theme tokens, AppCard, PrimaryButton, ScreenContainer, SectionHeader, StatCard, ProgressRing, BrandTagline, ExerciseThumb, haptics.
packages/backend/        @revivex/backend: config-gated Supabase client factory. Typed data access lands with the slices.
packages/test-utils/     @revivex/test-utils: the tiny check/suite/report harness used by every suite.
db/schema.sql            Shared Postgres schema with RLS. db/tests/rls.test.ts runs it in PGlite.
docs/                    recon, architecture, feature backlogs, comparison (step 6), existing operational docs.
```

Dependency direction: apps depend on packages, design-system depends on core, nothing depends on an app, apps never import each other. Both apps pin identical Expo, React and React Native versions so npm hoists one copy of each. Expo SDK 54 detects the workspace root for Metro, so no custom Metro config was needed.

What stayed in `apps/direction-a/src/`: React contexts, health adapters, GPS background task, RevenueCat wrapper, maps components, the workout logger components, and the activity feed card. They are app state or device integrations, not shared logic.

Verification after the move (2026-10-11):

| Check | Result |
| --- | --- |
| `npm run typecheck` (6 workspaces) | Clean |
| `npm test` | 82 checks pass (70 in core, 12 in Direction A) |
| `npm run test:db` | 66 policy checks pass, schema applied twice to prove idempotency |
| `npx expo export --platform ios` per app | Both apps produce a Hermes bundle. Direction A export is 11 MB with 116 assets, Direction B is 7.9 MB. Direction B currently bundles the exercise illustrations through the core barrel, which is fine because the coach uses the library |

Commands: `npm run start:a`, `npm run start:b`, `npm run typecheck`, `npm test`, `npm run test:db`. Expo Go remains the development target. Native modules in Direction A stay lazily loaded.

## 3. Shared stack

| Layer | Choice | Why |
| --- | --- | --- |
| Mobile | Expo SDK 54, Expo Router 6, TypeScript, Expo Go compatible | Existing codebase and owner constraint. Both apps share it so the comparison is fair |
| Local state | AsyncStorage through the existing contexts (Direction A) and equivalent small stores (Direction B) | Local-first keeps airplane-mode logging and protects existing user data |
| Backend | Supabase: Auth, Postgres with row-level security, Edge Functions (Deno), Storage later | One backend for both directions, RLS on every table, server-side secrets, free tier is enough for prototypes |
| Auth | Email and password now (already wired in Direction A). Sign in with Apple before any store release that offers third-party login, Google after | Apple requires Sign in with Apple when other social logins are offered. Not needed for the slices |
| Server code | Edge Functions: `strava-connect`, `strava-callback`, `strava-push`, `strava-webhook`, `strava-disconnect`, `delete-account` | Only place that holds the Strava client secret and user tokens. Account deletion is an App Store requirement |
| Secrets | Supabase project secrets for Strava client id and secret. Client ships only the Supabase URL and anon key in `app.json` `extra` | Anon key is publishable by design. Nothing else leaves the server |
| Fonts and icons | Inter (SIL Open Font License) through `@expo-google-fonts/inter`, loaded by the design system. Icons stay on Ionicons and Material Community Icons from `@expo/vector-icons` | Satisfies the open-source font rule. Palette, voice and components are our own |
| Unit tests | tsx-based suites per workspace, PGlite for schema and policies | Already in place, no Jest needed |
| End-to-end tests | Proposed: Playwright against `expo start --web` for the core flows of both apps. Detox or Maestro on the Mac later for native-only paths (GPS, Health) | Playwright runs in this sandbox and in CI. It needs `react-native-web` and `@expo/metro-runtime` added as dev dependencies to both apps. Decision 4 below |

## 4. Data model and sync

### 4.1 Local-first with a cloud mirror

The device stays the source of truth for a user's own training data. Existing AsyncStorage keys are preserved. Each store gains an outbox:

- On save: write locally first, then upsert the row to Supabase keyed by `(user_id, client_id)`. The schema has a unique constraint for that pair on every training table.
- On delete: delete locally, then delete the row.
- On sign-in or app start: pull rows changed since the last pull and merge by `client_id`. Conflicts resolve last-write-wins on `updated_at`.
- Offline: the outbox retries with backoff. Nothing in the UI waits on the network.

This makes the vertical slice honest for both directions: a logged item exists locally, in the database under the user's id, and in the list and detail screens.

### 4.2 Tables

Full definitions in `db/schema.sql`. Summary:

| Group | Tables | Access |
| --- | --- | --- |
| Identity | `profiles` (private settings), `athlete_profiles` view (id, username, display name, avatar) | Profile owner-only. View readable by signed-in users only |
| Training (shared) | `workouts`, `runs`, `run_routes`, `hybrid_sessions`, `routines`, `body_weight_entries`, `exercise_templates` | Owner-only, all four operations |
| Social (A) | `posts` with visibility private, followers or public, `follows` with pending and accepted, `likes`, `comments` | Visibility-aware, signed-in users only. Likes and comments inherit the post's visibility |
| Strava (A) | `strava_connections`, `strava_oauth_states` (server-only), `strava_pushes` (client enqueues, server advances), `strava_connection_status` view | Tokens never reach a client. Clients can only insert queued rows for themselves |
| Daily coach (B) | `readiness_checkins`, `daily_plans` | Owner-only, one check-in and one plan per user per day |

Design choices worth approving explicitly:

- Nested payloads stay JSONB. `workouts.exercises`, `hybrid_sessions.segments`, `runs.splits`, `routines.exercises` and `daily_plans.plan` hold the same shapes the apps already use in `@revivex/core`. Upserts stay atomic, sync stays simple, and analytics keep running on-device with the existing utilities. Trade-off: no SQL across sets. If server-side analytics are ever needed, a normalized `workout_sets` table can be derived later.
- GPS traces live in `run_routes`, separate from `runs`, owner-only, and a check constraint rejects any route-point key inside `posts.details`. Sharing a map later requires an explicit masked copy, never the raw trace.
- `client_id` is the device id. Server ids are UUIDs. Devices never need the server id to sync.
- Account deletion cascades from `auth.users` through every table.

### 4.3 Direction B plan payload

`daily_plans.plan` holds `{ blocks, rationale, estimatedMinutes, readiness }` where a block is one of strength (exercise, sets, reps, target load, rest), run (type, distance or duration, pace guidance), hybrid (segments) or recovery (activity, duration). `engine_version` records which rules produced it so plans can be regenerated or compared after a rules change.

## 5. Security model

- Row-level security is enabled on every table, with policies granted to `authenticated` only. Anonymous access is denied everywhere, including public posts, until the owner decides otherwise.
- The two views are definer views on purpose, exposing exactly the columns they list. Supabase's linter flags definer views, and the comment on each view says why it is intended.
- `strava_connections` and `strava_oauth_states` have RLS enabled with no policies and their table privileges revoked from `anon` and `authenticated`. Only Edge Functions with the service role touch them. Before public beta the token columns move to Supabase Vault.
- `strava_pushes` lets a client insert only a `queued` row for itself and delete it only while still queued. The worker owns every other transition.
- `db/tests/rls.test.ts` asserts the above from the point of view of three users, an anonymous client and the service role. It runs in under ten seconds and must pass before any schema change merges.
- Client secrets: none. `app.json` carries the Supabase URL, the anon key and the RevenueCat public SDK key, all publishable. The Strava client secret exists only in Supabase secrets.
- Rate limits: Strava's limits are per app, not per user (200 requests per 15 minutes, 2,000 per day by default). The push worker drains the outbox at a paced rate and backs off on 429.

## 6. Strava push design (Direction A)

Scopes requested: `read,activity:write`. Nothing with `activity:read`.

1. Connect. The app calls `strava-connect` with its session. The function writes a `strava_oauth_states` row (state, user, return URL, 10-minute expiry) and returns the Strava authorize URL. The app opens it in the system browser. Strava redirects to `strava-callback` on the project's `supabase.co` domain, which is the callback domain registered on the Strava API app. The function validates the state, exchanges the code using the client secret, stores tokens in `strava_connections`, and redirects to the stored return URL. Return URLs are validated against an allowlist of schemes: `revivex://` and `revivex-daily://` for dev builds, `exp://` and `exps://` for Expo Go.
2. Push. On a workout, run or hybrid detail screen the user taps "Post to Strava". The app makes sure the activity row is mirrored, inserts a `strava_pushes` row with status `queued`, and invokes `strava-push`. The function refreshes the token if it expires within five minutes (access tokens live six hours and refresh tokens rotate), then uploads. Runs with a GPS trace go through `POST /uploads` as GPX built from `run_routes`. Manual runs, workouts and hybrid sessions go through `POST /activities` with `sport_type` and a description listing exercises or segments. The function stores `strava_activity_id` and marks the row `done`, `duplicate` or `failed`.
3. Webhook. `strava-webhook` answers the subscription handshake and processes `athlete` events with `authorized: false` by marking `revoked_at` and clearing tokens. Activity events are ignored because nothing is pulled.
4. Disconnect. `strava-disconnect` calls `POST /oauth/revoke` and deletes the connection row.

Owner actions before step 4 reaches Strava: create the Strava API application with the callback domain, keep the Strava subscription that the developer program now requires, and add the client id and secret to Supabase secrets. Never paste them into chat, the repo or `app.json`. The app starts in single-player mode and can be self-upgraded to 10 athletes. A review is needed before any beta larger than that. The connect button and labels follow Strava's brand guidelines ("Connect with Strava", "Compatible with Strava").

FIT uploads with per-set data, which would let strength workouts appear in Strava's own workout log with sets, are a nice-to-have after the slices.

## 7. Direction A plan

Vertical slice (step 3): sign in from Profile with the existing email and password flow, log a strength workout with the existing logger, see it mirrored to `workouts`, and see it in the existing history list and detail screen with a sync indicator. Signing in on a second device pulls the same history.

Fixes carried from the recon, in order: the social schema is replaced by `db/schema.sql` (done), the design system loads an open-source font, the background rest timer gets a device check, and the four missing logger basics (set types, RPE, supersets, custom exercises) follow in breadth. The 5-tab navigation stays.

## 8. Direction B plan (daily coach)

Product shape: one home screen called Today. It shows the readiness check-in when none exists for the day, then the single generated session with its rationale, a Start or Mark complete action, and a small weekly strip. History and Settings are reachable from the header. No feed, no routines screen, no exercise browser. If a second tab is ever needed it is History, nothing more.

Rules engine: a new package `@revivex/coach`, pure TypeScript, depends on `@revivex/core` only, fully unit-tested, versioned.

Inputs: profile (training focus, goal, weekly target, experience, units), the last 28 days of workouts, runs and hybrid sessions, today's readiness check-in, and the date.

Output: a `DayPlan` with kind (lift, run, hybrid, recovery, rest), title, blocks, estimated minutes, rationale lines, engine version.

Rules for version 0.1:

1. Readiness score = sleep 40%, soreness 35% (inverted), energy 25%, scaled 0 to 100. Below 40 the day becomes recovery or rest. 40 to 65 keeps the planned session with volume reduced 30% and no top sets. Above 65 is a full session.
2. The weekly structure comes from focus and weekly target, for example Hybrid at 4 days is lift, run, lift, hybrid, and Run at 3 days is easy, quality, long. The engine picks the next slot not yet completed this week, so skipping a day never breaks the plan.
3. A strength slot is moved or swapped when the same muscle groups were trained within 48 hours. A quality run is moved when a hard run happened within 48 hours.
4. Strength prescriptions come from last performance: all target reps hit means plus 2.5% for upper-body lifts and plus 5% for lower-body lifts, rounded to plate increments, otherwise repeat. New exercises get a conservative starting prescription.
5. Run prescriptions come from recent mileage and pace: next-week volume capped at 10% growth, long run at most 30% of weekly volume, easy pace derived from recent average pace.
6. Hybrid sessions come from the existing templates, with rounds scaled by readiness.
7. Every plan carries two to four rationale lines in plain language.

Vertical slice (step 3): sign in, check in, see today's plan, mark it complete, see it in History and in a plan detail screen, with check-ins, plans and the completed session mirrored to Supabase.

## 9. Testing strategy

- Unit: `packages/core`, the new `packages/coach`, Direction A device-mapping suites, and the PGlite policy suite. All run with `npm test` and `npm run test:db`.
- End-to-end: Playwright on web for sign in, log or check in, list and detail in each app. Native-only paths (GPS, Health, maps, purchases) are excluded on web and covered by the owner's device checklist in `docs/TESTING.md` until Detox or Maestro is set up on the Mac.
- Bug reports: each failing scenario is written up with steps to reproduce in the step 5 report.

## 10. Rough effort

| Work | Estimate |
| --- | --- |
| Direction A slice (auth entry, outbox, mirror, sync indicator, Playwright flow) | 2 to 3 working sessions |
| Direction B slice (coach package with tests, Today, check-in, complete, history, detail, mirror, Playwright flow) | 3 to 4 working sessions |
| Strava push (functions, connect UI, worker, webhook) | 2 sessions plus owner setup |
| Breadth per direction | Tracked in the feature backlogs |

## 11. Decisions needed before step 3

1. Approve `db/schema.sql` as the shared schema: JSONB payloads, visibility model, server-only Strava tables, Direction B tables.
2. Approve local-first with a cloud mirror and last-write-wins conflicts.
3. Approve the Strava push scope: GPX for GPS runs, manual activities for everything else, FIT set data later.
4. Approve Playwright on web as the end-to-end approach, which adds `react-native-web` and `@expo/metro-runtime` to both apps as dev dependencies. The alternative is Detox on the Mac, which this sandbox cannot run.
5. Approve the Direction B product shape in section 8.
6. Owner action before the slices can run end to end: create a Supabase project, run `db/schema.sql` in its SQL editor, and put the project URL and anon key into each app's `app.json` under `expo.extra`. Both values are publishable. Until then every cloud surface shows its "not configured" state and the slices run local-only.
