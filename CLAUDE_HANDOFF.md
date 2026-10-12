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
- Direction A (`apps/direction-a`) is the Phase 50 app plus: Account & Sync screen, cloud mirror for workouts, routines, runs, GPS traces, hybrid sessions and body weight, sync chips on workout history and detail, account deletion, Strava connect and Post to Strava (functions written, not deployed), set types in the logger, Inter in shared components.
- Direction B (`apps/direction-b`) is the daily coach: setup, check-in, Today with swap and shorten, a completion editor for what was actually done, plan detail, history, account, cloud mirror of five tables with tombstones.
- Shared: `@revivex/core`, `@revivex/design-system`, `@revivex/backend` (sync engine), `@revivex/coach` (rules engine), `@revivex/test-utils`.
- `db/schema.sql` is final for this phase and has not been applied to any Supabase project yet. `supabase/functions/*` (delete-account and the five Strava functions) are written and not deployed.
- Verification: see `docs/test-report.md`. All unit, policy and end-to-end suites pass in the sandbox.

## Mac Checklist (first session on the Mac)

If Codex runs this session for the owner, it follows `docs/codex-runbook.md` instead (same steps, written for an agent, with guardrails) and reports in `docs/mac-run-report.md`.

1. Pull the branch and install.

   ```bash
   git fetch origin && git checkout claude/two-directions && npm install
   npm run typecheck && npm test && npm run test:db
   npm run e2e:full
   ```

2. Create a new Supabase project (do not reuse one that ran the old Phase 39 schema) and follow `supabase/README.md`: run `db/schema.sql`, turn off email confirmation for development, put the URL and anon key in `apps/*/.env.local`, then `npm run e2e:live` to prove two-device sync against it. Deploying `delete-account` can wait.
3. Direction A in Expo Go: `npm run start:a`. Profile → Account → Create account → sign in. Log a workout. The history card should show "Syncing" then "Synced". Check the row in the Supabase table editor (`workouts`, your user id). Sign in on a second device or the simulator and watch history arrive.
4. Direction B in Expo Go: `npm run start:b`. Settings → Training history → Import the JSON you exported from Direction A (Profile → Your Data → Export) so the coach has your real history. Then Set up → Check in → plan → Mark complete (edit what you actually did) → History → detail. Account → sign in; check-ins, plans and the completed session should sync.
5. Run the device checklist in `docs/TESTING.md` for the native-only paths (GPS, Health, maps). None of them changed in this phase, but the move to the monorepo deserves one pass.
6. Report anything odd with steps to reproduce. The next build steps are listed under "Next" below.
7. When satisfied, open a pull request from `claude/two-directions` into `main`. Nothing has been pushed to `main`.

## Next (in order)

1. Strava on the Mac: create the Strava API app (callback domain = your Supabase host), set secrets, deploy the five functions per `supabase/README.md`, then Profile → Connections → Strava → Connect, and Post to Strava from a workout detail.
2. Direction A logger breadth: RPE input (model field exists), supersets, custom exercises. Sync chips on run, hybrid and routine screens. Typography pass.
3. Direction B: local reminder for the check-in, per-exercise trends from the shared core utilities, a rest timer while following a plan.
4. Revisit `docs/comparison.md` (currently a draft) after a week on device.

## Storage Keys

Direction A keys are unchanged (see `PROJECT_STATE.md`). Direction B uses `revivex.daily.*` keys. Sync state lives under `revivex.sync.v1.<userId>` (A) and `revivex.daily.sync.v1.<userId>` (B).
