# ReviveX Project State

Last updated: 2026-07-05

## Current Master Direction

ReviveX is the rebranded SDK 54 master version of the former HybridTrack project.

Tagline: Lift. Run. Revive.

Positioning: A hybrid fitness tracker for lifting, running, conditioning, routines, and progress analytics.

Do not revert to SDK 51. Continue from Expo SDK 54.

## Confirmed Recovery Baseline

Current recovery baseline:

```text
/Users/georgegonzalez/Desktop/ReviveX-2026-06-20-Phase9-onboarding-profile-stable.zip
```

Use this zip as the stable Phase 9 recovery point.

Previous Phase 8 recovery baseline remains available:

```text
/Users/georgegonzalez/Desktop/ReviveX-2026-06-20-Phase8-data-ux-cleanup-stable.zip
```

Previous Phase 7 recovery baseline remains available:

```text
/Users/georgegonzalez/Desktop/ReviveX Baselines/ReviveX-2026-06-20-Phase7-hybrid-session-tracker-stable.zip
```

Previous Phase 6 recovery baseline remains available:

```text
/Users/georgegonzalez/Desktop/ReviveX Baselines/ReviveX-2026-06-20-Phase6-manual-run-logging-stable.zip
```

## Stack

- Expo: `54.0.35`
- React: `19.1.0`
- React Native: `0.81.5`
- Expo Router: `6.0.24`
- TypeScript: `~5.9.2`
- Storage: `@react-native-async-storage/async-storage`
- Target runtime: Expo Go

## Completed

### Phase 1: App Shell

- Expo Router app shell.
- Five tabs:
  - Home
  - Train
  - Run
  - Hybrid
  - Progress
- Premium dark fitness-tech theme.

### Phase 2: Strength Workout Logger

- Start Empty Workout.
- Active Workout screen.
- Exercise picker from local exercise library.
- Add/edit/delete sets.
- Weight/reps inputs.
- Finish workout and save locally.

### Phase 3: Workout History + Detail

- Workout history/detail/repeat/delete was treated as complete before Phase 4.

### Phase 4: Routine Builder

- Functional My Routines section in Train tab.
- Create Routine screen.
- Routine Detail screen.
- Local routine persistence.
- Start Routine creates a normal active workout.

### Phase 5: Progress Dashboard v1

- Progress tab uses real saved workout history.
- Calculates workouts, weekly workouts, total volume, total sets, weekly activity, muscle group stats, PR v1, and highlights.

### Phase 5.5: ReviveX Rebrand + Design System Integration

- Visible app brand changed to ReviveX.
- Tagline added: Lift. Run. Revive.
- Theme tokens updated to dark neutrals with teal/lime accents.
- Expo display name changed to ReviveX.
- Technical identifiers and storage keys preserved for compatibility.
- App icon/splash assets documented as TODOs because clean PNGs are not present.

### Phase 5.6: UI Polish + Brand Fidelity

- Bottom tab bar is safe-area-aware for modern iPhones.
- Progress label clipping was fixed.
- ReviveX wordmark/tagline styling was tightened.
- CTA gradient and card glows were softened to preserve a dark premium feel.

### Phase 6: Manual Run Logging v1

- Local run persistence with AsyncStorage.
- Manual Run Log screen.
- Run History screen.
- Run Detail screen with delete confirmation.
- Run tab uses real saved run data.
- Basic running stats and PRs:
  - weekly mileage
  - runs this week
  - average pace
  - longest run
  - best pace
  - fastest 5K estimate for 5K+ runs
- Progress Dashboard has a lightweight Running Snapshot section.

### Phase 7: Hybrid Session Tracker v1

- Local hybrid session persistence with AsyncStorage.
- Hybrid tab uses real saved hybrid session data.
- Start Hybrid Session screen.
- Active Hybrid Session screen with manual segment timing.
- HYROX Race Sim template:
  - 8 run segments
  - 8 station segments
- Hybrid Benchmark template.
- Simple Custom Hybrid starter with add-run/add-station controls.
- Hybrid History screen.
- Hybrid Detail screen with segment breakdown and delete confirmation.
- Basic hybrid stats:
  - total sessions
  - best session time
  - average session time
  - latest session
  - run vs station time
  - fastest and slowest timed segments
- Progress Dashboard has a lightweight Hybrid Snapshot section.

### Phase 8: Data + UX Cleanup Pass

- Home dashboard uses real local workout, run, and hybrid session data.
- Fake recent activity, run, hybrid, and top-level demo stats were removed.
- Date formatting is centralized for relative, calendar, and full detail dates.
- Duration formatting is centralized for timer-style and short dashboard display.
- Workout detail/delete/repeat flow is wired from Train history.
- Delete confirmations use consistent titles, messages, and Cancel/Delete actions.
- Run, Hybrid, and Train empty states now include clearer next actions.
- Storage keys are documented as a compatibility contract.

### Phase 9: Onboarding + Profile v1

- First-launch onboarding flow with ReviveX brand intro.
- Local/private profile persistence.
- Profile fields:
  - display name
  - optional local username
  - training focus
  - primary goal
  - experience level
  - weekly training target
  - preferred weight unit
  - preferred distance unit
- Profile screen with local totals for workouts, runs, hybrid sessions, and routines.
- Edit Profile screen.
- Home uses profile name, training focus, and weekly target progress.
- Manual Run Log defaults to the preferred distance unit for new runs.
- Active Workout set table shows the preferred weight unit label without converting saved data.
- Community is represented only as a “coming later” placeholder. No real social features exist yet.

### Phase 10: Local Activity Feed + Share Cards v1

- Local/private Activity Feed combines completed workouts, runs, and hybrid sessions.
- Home Recent Activity uses the shared local feed and real saved data only.
- Full Activity screen shows all combined training activity newest first.
- Feed cards route to the matching Workout, Run, or Hybrid detail screen.
- Workout, Run, and Hybrid detail screens include a View Share Card action.
- Share Card preview screen creates ReviveX-branded recap cards for:
  - strength workouts
  - runs
  - hybrid sessions
- Built-in text sharing uses React Native `Share`.
- No public feed, followers, likes, comments, clubs, leaderboards, cloud profiles, or backend social features were added.

### Phase 11: Edit + Manage Logged Data v1

- Saved runs can be edited from Run Detail.
- Saved hybrid sessions can be edited from Hybrid Detail.
- Saved routines can be edited from Routine Detail.
- Completed workouts support lightweight metadata edits:
  - title
  - date
  - notes
- Context update functions preserve existing IDs and storage keys.
- Edited items flow through derived dashboards automatically:
  - Run tab and stats
  - Hybrid tab and stats
  - Train routine cards
  - Progress snapshots
  - Activity Feed
  - Share Cards
- Full completed workout set-by-set editing remains deferred.

### Phase 12: Persistence + Real Session Data v1

- Local persistence was verified for:
  - profile and preferences
  - completed workouts
  - routines
  - logged runs
  - logged hybrid sessions
- Activity Feed now has its own persisted local snapshot.
- Activity Feed rebuilds from real saved workout, run, and hybrid session data whenever those logs change.
- Home Recent Activity and the full Activity screen read from the persisted Activity Feed context.
- Share Cards prefer real saved session data and only fall back to the persisted feed snapshot while source logs are still loading.
- Deleted or missing activity IDs continue to show safe missing-state screens.
- Demo data remains limited to static exercise-library preview data, not fake saved activity.

### Phase 13: Completed Workout Editing v2

- Edit Workout screen now supports full set-by-set editing of completed workouts:
  - edit weight and reps per set
  - toggle set completion (Done) per set
  - add and remove sets per exercise (last set per exercise is protected)
  - remove exercises with confirmation
  - add exercises via inline exercise-library search
- Live summary shows total sets, completed sets, and volume while editing.
- `updateWorkoutDetails` in WorkoutContext recalculates `totalSets` and `totalVolume` from edited sets on save.
- Exercise and set IDs are preserved where possible; new items get fresh IDs.
- Edited workouts flow through Progress, Activity Feed, and Share Cards automatically.
- Saving requires at least one exercise; deleting the whole workout stays on the detail screen.

### Phase 14: PR History v1

- New PR History screen at `app/progress/prs.tsx`:
  - Recent PRs timeline (newest first) with new-top-weight and new-est-1RM events.
  - All-Time Bests per exercise: best weight × reps, estimated 1RM (Epley), PR count, last PR date.
  - Rows link to the source workout detail screen.
- `src/utils/prHistory.ts` derives PR history from saved workouts:
  - walks history oldest-first, tracks best weight and best estimated 1RM per exercise
  - emits at most one PR event per exercise per workout
  - only completed sets with weight and reps count.
- Progress tab Exercise PRs section has a View All link to PR History.
- PR weight labels use the profile preferred weight unit (label only, no conversion), replacing the hardcoded kg label on the Progress tab PR card.

### Phase 15: Exercise Progress Detail v1

- New per-exercise progress screen at `app/progress/exercise/[key].tsx` (key is `exerciseId`, falling back to exercise name):
  - summary of best set, best estimated 1RM, and total sessions
  - trend chart over the last 12 sessions with an Est 1RM / Session Volume toggle (theme-native bars, no chart dependency)
  - full session history with best set, completed/total sets, and volume per session
  - session rows link to the source workout detail screen.
- `src/utils/exerciseProgress.ts` derives per-session exercise stats from saved workouts, combining duplicate entries of the same exercise within one workout.
- Entry points: PR History All-Time Bests rows and Progress tab Exercise PRs rows now open the exercise detail screen.

### Phase 16: Health Sync Foundation (Apple Health + Health Connect)

- Owner-approved direction change: Apple Health and Google Health Connect integration is now in scope (previous "do not add Apple Health" rule is retired).
- New health layer in `src/health/`:
  - `types.ts` — adapter contract, sync settings/state, safe session-range helpers.
  - `appleHealthAdapter.ts` — HealthKit via `@kingstinct/react-native-healthkit` (strength → traditionalStrengthTraining, runs → running with distance, hybrid → HIIT).
  - `healthConnectAdapter.ts` — Health Connect via `react-native-health-connect` (ExerciseSession records; runs also write a Distance record).
  - `healthService.ts` — platform adapter selection.
- `src/context/HealthContext.tsx` sync engine:
  - persists settings, connection flag, synced IDs, and last-sync time under `revivex.health.v1`
  - one-way auto-sync of new workouts, runs, and hybrid sessions while connected
  - per-type sync toggles and manual Sync Now.
- New Health Sync screen at `app/profile/health.tsx`, linked from a Connections section on the Profile screen.
- `app.json` adds the HealthKit and Health Connect config plugins, iOS health usage descriptions, and Android `minSdkVersion` 26 via `expo-build-properties`.
- Expo Go stays fully supported: native health modules are loaded lazily inside try/catch; in Expo Go the screen reports "needs the dev build" and sync stays dormant. Real syncing activates in a development/production build.

## Important Files

- `app/(tabs)/index.tsx`
  - Home dashboard, profile-aware welcome copy, primary ReviveX brand copy.
- `app/onboarding.tsx`
  - First-launch onboarding flow.
- `app/profile/index.tsx`
  - Local/private Profile screen.
- `app/profile/edit.tsx`
  - Edit Profile and preferences screen.
- `app/activity/index.tsx`
  - Full local/private Activity Feed screen backed by persisted feed context.
- `app/share/[type]/[id].tsx`
  - ReviveX-branded activity recap/share preview screen using real persisted session data when available.
- `src/components/ActivityFeedCard.tsx`
  - Shared activity feed card used by Home and Activity Feed.
- `src/context/ActivityFeedContext.tsx`
  - Persists the local/private activity feed snapshot and rebuilds it from saved logs.
- `src/utils/activityFeed.ts`
  - Combines workouts, runs, and hybrid sessions into sorted local feed items and share text.
- `app/(tabs)/train.tsx`
  - Train dashboard, routine list, recent strength workouts, exercise preview.
- `app/(tabs)/progress.tsx`
  - Progress Dashboard v1 with Running Snapshot and Hybrid Snapshot.
- `app/(tabs)/run.tsx`
  - Manual run dashboard, recent runs, running stats, PR preview.
- `app/(tabs)/hybrid.tsx`
  - Hybrid dashboard, start actions, stats, recent hybrid sessions.
- `app/run/log.tsx`
  - Manual Run Log screen.
- `app/run/history.tsx`
  - Run History screen.
- `app/run/[id].tsx`
  - Run Detail, edit entry point, share card entry point, and delete flow.
- `app/run/edit/[id].tsx`
  - Edit saved run title, date, distance, unit, duration, type, location, and notes.
- `src/context/RunContext.tsx`
  - Run persistence, add/update/delete operations, and stat calculation.
- `src/utils/runStats.ts`
  - Running stat, pace, distance, PR helpers.
- `app/hybrid/start.tsx`
  - Hybrid session setup screen.
- `app/hybrid/active.tsx`
  - Active hybrid session segment logger.
- `app/hybrid/history.tsx`
  - Hybrid History screen.
- `app/hybrid/[id].tsx`
  - Hybrid Detail, edit entry point, share card entry point, and delete flow.
- `app/hybrid/edit/[id].tsx`
  - Edit saved hybrid session metadata and segment details.
- `src/context/HybridContext.tsx`
  - Hybrid persistence, add/update/delete operations, and stat calculation.
- `src/context/ProfileContext.tsx`
  - Local profile persistence, onboarding completion state, preferences.
- `src/data/profileOptions.ts`
  - Profile choice lists and display helpers.
- `src/data/hybridTemplates.ts`
  - HYROX, Benchmark, and Custom Hybrid starter segment templates.
- `src/utils/hybridStats.ts`
  - Hybrid time, session, segment, and run-vs-station helpers.
- `app/routine/create.tsx`
  - Routine builder.
- `app/routine/[id].tsx`
  - Routine detail, edit entry point, start, and delete.
- `app/routine/edit/[id].tsx`
  - Edit saved routine metadata, goal, exercises, targets, and rest.
- `app/workout/active.tsx`
  - Active workout logger reused by empty workouts and routine workouts.
- `app/workout/[id].tsx`
  - Workout Detail, metadata edit entry point, repeat, share card entry point, and delete flow.
- `app/workout/edit/[id].tsx`
  - Lightweight completed workout metadata editor.
- `src/context/WorkoutContext.tsx`
  - Active workout, history, routines, AsyncStorage, routine/workout update operations, start routine, repeat workout, delete workout.
- `src/theme/theme.ts`
  - ReviveX color tokens, gradients, spacing, type scale.
- `src/utils/progress.ts`
  - Progress analytics helpers.
- `assets/README.md`
  - Required ReviveX app icon/logo asset TODOs.

## Storage Compatibility

These AsyncStorage keys must be preserved across app updates unless a safe migration is added:

| Storage key | Stores | Preserve? | Notes |
| --- | --- | --- | --- |
| `hybridtrack.workouts.v1` | Completed strength workouts | Yes | Kept from the original HybridTrack app so the ReviveX rebrand does not hide existing workout history. |
| `hybridtrack.routines.v1` | Saved workout routines | Yes | Kept from the original HybridTrack app for routine compatibility. |
| `revivex.runs.v1` | Manually logged runs | Yes | Added in Phase 6. |
| `revivex.hybridSessions.v1` | Manually logged hybrid sessions and segments | Yes | Added in Phase 7. |
| `revivex.profile.v1` | Local/private profile and preferences | Yes | Added in Phase 9. Does not create a cloud account. |
| `revivex.onboarding.v1` | Local onboarding completion state | Yes | Added in Phase 9. Safe to reset for testing, but not required for normal updates. |
| `revivex.activityFeed.v1` | Derived local/private activity feed snapshot | Yes | Added in Phase 12. Rebuilt from saved workouts, runs, and hybrid sessions. |

Do not rename or clear these keys without a migration, or existing local data can disappear.

## Verification

Run after changes:

```bash
npx tsc --noEmit
npx expo-doctor
npx expo start --tunnel --clear
```

Do not run EAS build unless explicitly requested.

## Known Limitations

- Share cards are preview screens plus text sharing only; image export is deferred.
- Activity Feed is local/private only; no public social/community features exist yet.
- Clean ReviveX icon/logo PNG files are still needed.
- npm audit reports moderate dependency warnings; do not run `npm audit fix --force` without a specific reason.

## Health Sync Status

- Health sync code is complete but dormant in Expo Go (native modules can't load there).
- To activate on device: create a development build (`eas build --profile development`) — requires an Apple Developer account for HealthKit entitlements on iOS.
- Storage key `revivex.health.v1` persists health sync settings and synced IDs.
- Reading workouts back from HealthKit/Health Connect (e.g. watch-recorded sessions into the ReviveX log) is the planned follow-up phase after the dev build exists.

## Suggested Phase 17

Pick based on owner priorities:

- Dev build setup (EAS) to light up Apple Health/Health Connect sync end to end.
- Health import v1: read watch/phone-recorded workouts from the health store into the ReviveX activity log.
- Share Card Image Export v1 (`react-native-view-shot` + `expo-sharing`, Expo Go compatible).
- ReviveX icon/splash asset pass once clean PNGs exist.
