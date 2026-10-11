# ReviveX Handoff

Date: 2026-10-11

## Read First

- `AGENTS.md`: rules.
- `docs/architecture.md`: the approved architecture.
- `docs/test-report.md`: what has been verified and how.
- `docs/features-a.md`, `docs/features-b.md`: backlogs with status.
- `docs/recon.md`: step 1 research.
- `PROJECT_STATE.md`: Direction A phase history (1 to 50) and storage keys.

## Current State

- Monorepo on branch `claude/two-directions`, pushed. `main` still holds the pre-restructure layout until the owner opens and merges a pull request.
- Direction A (`apps/direction-a`) is the Phase 50 app plus: Account & Sync screen, cloud mirror for workouts, routines, runs, GPS traces, hybrid sessions and body weight, sync chips on workout history and detail, account deletion, Inter in shared components.
- Direction B (`apps/direction-b`) is the daily coach: setup, check-in, Today, plan detail, history, account, cloud mirror of five tables.
- Shared: `@revivex/core`, `@revivex/design-system`, `@revivex/backend` (sync engine), `@revivex/coach` (rules engine), `@revivex/test-utils`.
- `db/schema.sql` is final for this phase and has not been applied to any Supabase project yet. `supabase/functions/delete-account` is written and not deployed.
- Verification: see `docs/test-report.md`. All unit, policy and end-to-end suites pass in the sandbox.

## Mac Checklist (first session on the Mac)

1. Pull the branch and install.

   ```bash
   git fetch origin && git checkout claude/two-directions && npm install
   npm run typecheck && npm test && npm run test:db
   npm run e2e:full
   ```

2. Create the Supabase project and follow `supabase/README.md`: run `db/schema.sql`, turn off email confirmation for development, paste the URL and anon key into both `app.json` files, deploy `delete-account`.
3. Direction A in Expo Go: `npm run start:a`. Profile → Account → Create account → sign in. Log a workout. The history card should show "Syncing" then "Synced". Check the row in the Supabase table editor (`workouts`, your user id). Sign in on a second device or the simulator and watch history arrive.
4. Direction B in Expo Go: `npm run start:b`. Set up → Check in → plan → Mark complete → History → detail. Account → sign in; check-ins, plans and the completed session should sync.
5. Run the device checklist in `docs/TESTING.md` for the native-only paths (GPS, Health, maps). None of them changed in this phase, but the move to the monorepo deserves one pass.
6. Report anything odd with steps to reproduce. The next build steps are listed under "Next" below.
7. When satisfied, open a pull request from `claude/two-directions` into `main`. Nothing has been pushed to `main`.

## Next (in order)

1. Strava push: Edge Functions (`strava-connect`, `strava-callback`, `strava-push`, `strava-webhook`, `strava-disconnect`), a connect card under Profile → Connections, and a "Post to Strava" action on detail screens. Needs the owner's Strava API app and subscription; secrets go to `supabase secrets set`.
2. Direction A logger breadth: set types, RPE, supersets, custom exercises. Sync chips on run, hybrid and routine screens.
3. Direction B: adjust today's plan (swap an exercise, shorten), local reminder for the check-in.
4. Step 6 comparison in `docs/comparison.md` once both directions have run on device.

## Storage Keys

Direction A keys are unchanged (see `PROJECT_STATE.md`). Direction B uses `revivex.daily.*` keys. Sync state lives under `revivex.sync.v1.<userId>` (A) and `revivex.daily.sync.v1.<userId>` (B).
