# ReviveX Handoff

Date: 2026-10-11

## Read First

- `AGENTS.md`: rules.
- `docs/architecture.md`: the step 2 proposal, awaiting approval.
- `docs/recon.md`: step 1 research.
- `PROJECT_STATE.md`: Direction A phase history (1 to 50) and storage keys.

## Current State

- Monorepo on branch `claude/two-directions`. `main` still holds the pre-restructure layout until the owner merges.
- `apps/direction-a` is the Phase 50 app moved into the workspace with imports rewritten to the shared packages. No behavior changes.
- `apps/direction-b` is a scaffold: root layout and a Today placeholder.
- `packages/core`, `packages/design-system`, `packages/backend`, `packages/test-utils` are extracted from the old `src/`.
- `db/schema.sql` replaces `docs/supabase/schema.sql`. It has not been applied to any Supabase project yet.

## Verification

```bash
npm run typecheck
npm test
npm run test:db
cd apps/direction-a && npx expo export --platform ios --output-dir /tmp/revivex-export-check
```

## Key Files

- `apps/direction-a/app/`: Expo Router routes (unchanged paths).
- `apps/direction-a/src/context/`: app state and AsyncStorage persistence.
- `apps/direction-a/src/health/`, `src/gps/`, `src/monetization/`, `src/social/supabase.ts`: device and cloud integrations.
- `packages/core/src/types/index.ts`: shared types, including `BodyWeightEntry`.
- `packages/core/src/utils/`: pure training logic. `packages/core/tests/`: 70 checks.
- `packages/core/src/data/`: exercise library, hybrid templates, HYROX data, illustrations map.
- `packages/design-system/src/theme/theme.ts`: tokens. `src/components/`: primitives.
- `packages/backend/src/index.ts`: `readSupabaseConfig`, `createRevivexSupabaseClient`.
- `db/schema.sql`, `db/tests/rls.test.ts`.

## Storage Keys

Unchanged. See the Storage Compatibility table in `PROJECT_STATE.md`.

## Owner Actions Pending

- Approve or amend `docs/architecture.md`.
- Create a Supabase project, run `db/schema.sql`, and add the URL and anon key to `apps/*/app.json` under `expo.extra` when ready for the vertical slices to run end to end.
- Later, for Strava: create the API application and keep the Strava subscription. Secrets go to Supabase secrets only.
