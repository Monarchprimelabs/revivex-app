# ReviveX Handoff

Date: 2026-06-20

## Current Master State

This project is the current working master version of ReviveX, rebranded from HybridTrack.

- App name: ReviveX
- Tagline: Lift. Run. Revive.
- Positioning: A hybrid fitness tracker for lifting, running, conditioning, routines, and progress.
- Expo SDK: 54
- Expo package: `expo@54.0.35`
- React: `19.1.0`
- React Native: `0.81.5`
- Expo Router: `6.0.24`
- Physical iPhone testing uses the current Expo Go app.
- Do not revert to SDK 51.
- Do not downgrade Expo, React, React Native, or Expo Router.

Read these files first:

- `PROJECT_STATE.md`
- `AGENTS.md`
- `CLAUDE_HANDOFF.md`
- `assets/README.md`

## Confirmed Backup

Baseline zip confirmed on Desktop:

```text
/Users/georgegonzalez/Desktop/HybridTrack Baselines/HybridTrack-2026-06-18-Phase5-progress-timer-baseline.zip
```

SHA256:

```text
3509dfcf9382b31441801422b30a5ab67c8b335c840e1b03654888cd05d89169
```

## Completed Phases

- Phase 1: App shell with 5 tabs: Home, Train, Run, Hybrid, Progress.
- Phase 2: Strength Workout Logger.
- Phase 3: Workout history/detail/repeat/delete status was treated as complete before Phase 4 began.
- Phase 4: Routine Builder.
- Phase 5: Progress Dashboard v1.
- Phase 5.5: ReviveX rebrand and design system starter integration.
- Phase 5.6: UI polish, safe-area tab bar fix, and brand fidelity pass.
- Phase 6: Manual Run Logging v1.

## Phase 5.5 Changes

- Visible brand changed from HybridTrack to ReviveX.
- Home screen now displays ReviveX and `Lift. Run. Revive.`
- Theme moved to dark neutrals with teal/lime accents:
  - `#0F1114`
  - `#1A1D21`
  - `#2A2F36`
  - `#3A4048`
  - `#00B4B3`
  - `#C6FF00`
- Main CTA buttons use the existing `expo-linear-gradient` dependency for teal-to-lime gradient styling.
- `app.json` display name changed to ReviveX.
- Slug, scheme, iOS bundle identifier, Android package, and AsyncStorage keys were preserved for compatibility.
- App icon/splash assets were not wired because clean PNG assets are not present.

## Phase 6 Features Added

- Manual Run Log screen.
- Run History screen.
- Run Detail screen with delete confirmation.
- Run data model and local AsyncStorage persistence.
- Run tab now uses real saved run data instead of demo runs.
- Basic running stats and PRs:
  - weekly mileage
  - runs this week
  - average pace
  - longest run
  - best pace
  - fastest 5K estimate for 5K+ runs
- Progress tab has a lightweight Running Snapshot section.

## Important Rules

- Do not rebuild the app from scratch.
- Do not change the existing 5-tab navigation.
- Keep Expo Go compatibility.
- Do not add Apple Health.
- Do not add GPS.
- Do not add Supabase.
- Do not add RevenueCat.
- Do not add AI.
- Do not add subscriptions.
- Do not run EAS build unless explicitly requested later.
- Do not crop the ReviveX design system screenshot into production icon assets.

## Collaboration Workflow

Use this workflow to keep the human, Claude, and Codex aligned:

1. Claude helps with planning, UX review, feature specs, and second opinions.
2. Codex implements code, runs checks, fixes TypeScript/runtime issues, and maintains repo state.
3. The human approves direction and phase scope.
4. Major checkpoints should be committed to git.
5. After each major phase, update `PROJECT_STATE.md` and this handoff file.

Do not invent a different project state from memory. Use the files in this repository as the source of truth.

## Key Files

- `src/theme/theme.ts`
  - ReviveX theme tokens and compatibility aliases.
- `src/context/WorkoutContext.tsx`
  - Owns active workout, history, routines, AsyncStorage persistence, and `startWorkoutFromRoutine`.
- `src/types/index.ts`
  - Defines workout and routine types.
- `src/utils/progress.ts`
  - Progress Dashboard v1 analytics.
- `app/(tabs)/index.tsx`
  - Home dashboard and visible ReviveX branding.
- `app/(tabs)/train.tsx`
  - Train tab, routine list, start empty workout, routine cards, recent workouts.
- `app/(tabs)/progress.tsx`
  - Progress Dashboard v1.
- `app/(tabs)/run.tsx`
  - Run dashboard, manual logging entry point, recent runs, PR preview.
- `app/run/log.tsx`
  - Manual Run Log screen.
- `app/run/history.tsx`
  - Run History screen.
- `app/run/[id].tsx`
  - Run Detail and delete flow.
- `src/context/RunContext.tsx`
  - Run state, AsyncStorage persistence, add/delete/update/get helpers.
- `src/utils/runStats.ts`
  - Pace, distance, weekly mileage, PR, and formatting helpers.
- `app/routine/create.tsx`
  - Routine builder screen.
- `app/routine/[id].tsx`
  - Routine detail/start/delete screen.
- `app/workout/active.tsx`
  - Existing active workout screen reused by empty workouts and routine workouts.
- `assets/README.md`
  - Missing ReviveX icon/logo asset requirements.

## Verification

Run after changes:

```bash
npx tsc --noEmit
npx expo-doctor
npx expo start --tunnel --clear
```

## Current Test Command

```bash
cd "$HOME/Desktop/hybrid fitness tracker"
npx expo start --tunnel --clear
```

## Known Limitations

- Routine editing is intentionally deferred.
- Full PR history is deferred.
- Exercise-specific progress graphs are deferred.
- Clean ReviveX production assets are still needed:
  - `assets/icon.png`
  - `assets/adaptive-icon.png`
  - `assets/splash-icon.png` or `assets/splash.png`
  - transparent RX logo PNG
- npm audit reports moderate dependency warnings; do not run `npm audit fix --force` casually because it can introduce breaking changes.

## Suggested Phase 7

Run Improvements v2:

- Edit saved runs.
- Add weekly/monthly run summaries.
- Add richer run charts after enough data exists.
- Keep GPS and Apple Health for later phases.
