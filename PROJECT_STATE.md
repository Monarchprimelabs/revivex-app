# ReviveX Project State

Last updated: 2026-06-20

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

## Important Files

- `app/(tabs)/index.tsx`
  - Home dashboard, profile-aware welcome copy, primary ReviveX brand copy.
- `app/onboarding.tsx`
  - First-launch onboarding flow.
- `app/profile/index.tsx`
  - Local/private Profile screen.
- `app/profile/edit.tsx`
  - Edit Profile and preferences screen.
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
  - Run Detail and delete flow.
- `src/context/RunContext.tsx`
  - Run persistence and run operations.
- `src/utils/runStats.ts`
  - Running stat, pace, distance, PR helpers.
- `app/hybrid/start.tsx`
  - Hybrid session setup screen.
- `app/hybrid/active.tsx`
  - Active hybrid session segment logger.
- `app/hybrid/history.tsx`
  - Hybrid History screen.
- `app/hybrid/[id].tsx`
  - Hybrid Detail and delete flow.
- `src/context/HybridContext.tsx`
  - Hybrid persistence and hybrid operations.
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
  - Routine detail, start, delete.
- `app/workout/active.tsx`
  - Active workout logger reused by empty workouts and routine workouts.
- `app/workout/[id].tsx`
  - Workout Detail, repeat, and delete flow.
- `src/context/WorkoutContext.tsx`
  - Active workout, history, routines, AsyncStorage, start routine, repeat workout, delete workout.
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

- Routine editing is deferred.
- Full PR history is deferred.
- Exercise-specific progress graphs are deferred.
- Clean ReviveX icon/logo PNG files are still needed.
- npm audit reports moderate dependency warnings; do not run `npm audit fix --force` without a specific reason.

## Suggested Phase 10

Profile + Preferences Improvements v2:

- Add optional avatar image selection.
- Add full unit handling for strength sets with per-workout/per-set metadata.
- Add profile reset/export controls.
- Improve onboarding replay/testing controls.
- Keep GPS and Apple Health for later phases.
- Do not add real social/community features until backend/auth is planned.
- Keep it local and Expo Go compatible.
