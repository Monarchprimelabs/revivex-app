# ReviveX Agent Rules

## Source Of Truth

This repository is the master version of ReviveX, rebranded from HybridTrack. As of 2026-10-11 it is a monorepo running a two-direction program (see `docs/recon.md`, `docs/architecture.md`):

- `apps/direction-a/`: the existing hybrid tracker (Phase 50), moved as-is.
- `apps/direction-b/`: the daily coach, a deterministic rules engine with a readiness check-in.
- `packages/`: shared code. `@revivex/core` (types, pure logic, exercise library), `@revivex/design-system` (theme, primitives, haptics), `@revivex/backend` (Supabase client factory), `@revivex/test-utils`.
- `db/schema.sql`: the shared Supabase schema with row-level security. `db/tests/rls.test.ts` tests the policies in PGlite.

Rules that still hold:

- Continue from the Expo SDK 54 codebase. Do not revert to SDK 51.
- Do not downgrade Expo, React, React Native, or Expo Router. Keep both apps on identical versions.
- Preserve Expo Go compatibility. Native modules stay lazily loaded.
- Keep Direction A's 5-tab navigation: Home, Train, Run, Hybrid, Progress.
- Do not rename app folders, slugs, schemes, bundle identifiers, or AsyncStorage keys without an explicit request.

## Brand

- App name: ReviveX (written "Revive X" in prose is fine). Both directions keep the name.
- Tagline: Lift. Run. Revive.
- Product: hybrid fitness tracker for lifting, running, conditioning, routines, and progress.
- Visual style: premium dark-first interface with intentional teal/lime accents. Do not make the app overly neon.
- Original design only: our own palette, voice, components and illustrations. Icons from `@expo/vector-icons`, fonts under an open-source license. Never copy another app's assets, copy, layouts or code.

## Product Constraints

Allowed by owner decision (dates in `PROJECT_STATE.md` and `docs/architecture.md`): Supabase auth, Postgres and Edge Functions; Apple Health and Health Connect; GPS run tracking; RevenueCat rails launched dark; Strava through the official API, push-first.

Do not add these unless the owner explicitly changes direction:

- Any LLM or AI feature. The daily coach is a rules engine, not an AI coach.
- Turning on subscription gating.
- EAS builds from agents. Builds run on the owner's Mac.
- Pulling Strava data into permanent Revive X history, showing Strava data to anyone but its owner, or using Strava data in any AI feature. Strava's API policy forbids these.
- Scraping or unofficial APIs. Hevy import is bring-your-own-key only, and a convenience.
- Features the owner has not asked for.

## Engineering Rules

- Do not rebuild either app from scratch.
- Keep changes scoped to the requested step.
- Shared logic goes in `packages/`. Apps depend on packages, design-system depends on core, nothing depends on an app, apps never import each other.
- Prefer existing theme, components, context, and local storage patterns. Local-first stays: AsyncStorage on device, Supabase as a mirror.
- Every database table has row-level security. Policies are granted to `authenticated` only. Server-only tables have no client policies and revoked privileges. `npm run test:db` must pass after any schema change.
- No secrets in the client. `app.json` carries only publishable keys (Supabase URL and anon key, RevenueCat public SDK key). Strava secrets live in Supabase secrets.
- Preserve existing AsyncStorage keys unless implementing a safe migration.
- Do not run broad package upgrades unless required to fix a confirmed issue.
- Do not run `npm audit fix --force` casually.
- Do not delete user data or generated project files unless the task requires it.
- Work on a branch. Ask before pushing to `main` or opening a pull request.

## Current Stack

- Expo SDK 54, Expo `54.0.35`, React `19.1.0`, React Native `0.81.5`, Expo Router `6.0.24`, TypeScript `~5.9`
- npm workspaces, AsyncStorage, Supabase (`@supabase/supabase-js`), PGlite for schema tests

## Verification

After code changes, from the repo root:

```bash
npm run typecheck
npm test
npm run test:db
```

For runtime verification, from `apps/direction-a` or `apps/direction-b`:

```bash
npx expo start --tunnel --clear
npx expo export --platform ios --output-dir /tmp/revivex-export-check
```

`npx expo-doctor` needs network access to Expo's servers. Do not run EAS build unless the owner explicitly requests it.

## Program Status

- Direction A phases 1 to 50 are recorded in `PROJECT_STATE.md`.
- Two-direction program: step 1 recon (`docs/recon.md`), step 2 restructure and architecture (`docs/architecture.md`, `db/schema.sql`, approved 2026-10-11), step 3 vertical slices for both directions, step 4 in progress (Direction A mirrors every table, account deletion), step 5 report in `docs/test-report.md`. Backlogs in `docs/features-a.md` and `docs/features-b.md`. Mac checklist in `CLAUDE_HANDOFF.md`.

## Asset Rules

- The ReviveX design system screenshot is a visual reference only.
- Do not crop the screenshot into production App Store assets.
- Exercise illustrations in `packages/core/assets/exercises` are owner-generated originals.
- See `apps/direction-a/assets/README.md` for required icon/logo files.

## Collaboration Workflow

- Owner decision 2026-10-11: Claude implements both directions in this program, including verification and repo state. Codex may still be used for second opinions or device testing on the Mac.
- Keep `PROJECT_STATE.md`, `CLAUDE_HANDOFF.md`, and the `docs/` program files updated after each step.
- Commit each completed step with a clear message.
