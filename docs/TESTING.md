# ReviveX Pre-TestFlight Test Checklist

Run through this on the development build (not Expo Go) — the dev build is
the only place health sync, background GPS, and the app icon are active.

## Build commands (Mac Mini)

```bash
git checkout main && git pull
npm install
npx tsc --noEmit          # should be clean
npx expo-doctor           # should pass all checks (needs network)

# Dev build for your own phone:
eas build --profile development --platform ios

# TestFlight build (after dev-build testing passes):
eas build --profile preview --platform ios
eas submit --platform ios
```

Note: external TestFlight testers require Apple's beta review and a privacy
policy URL. Internal testers (your own team, up to 100) do not.

## 1. First launch / identity

- [ ] RX app icon on the home screen; splash shows the RX mark on dark
- [ ] Fresh install shows onboarding; completing it lands on Home
- [ ] Profile name, focus, and weekly target appear on Home

## 2. Strength training loop

- [ ] Start Workout → add exercise → log sets → rest timer starts when a set
      is checked (+15s and Skip work; phone buzzes at zero)
- [ ] "Last: …" line shows previous numbers for a repeated exercise
- [ ] Plate calculator (disc icon) shows correct per-side plates (test 225 lb)
- [ ] Finish → workout appears in Train history, Home feed, Progress totals
- [ ] Workout Detail → Edit Workout: change reps/weight, add/remove a set,
      add an exercise → totals recalculate
- [ ] Save as Routine → routine created with sensible targets → Start Routine
      pre-fills sets and rest times

## 3. GPS running (the big one)

- [ ] Start GPS Run → permission prompt → distance ticks up on a walk/run
- [ ] Rolling pace and average pace look sane; splits appear each mi/km
- [ ] Pause at a light → distance stops; Resume → no distance jump
- [ ] DEV BUILD: lock the phone mid-run for 5+ minutes → unlock → distance
      caught up (background tracking); Android shows the tracking notification
- [ ] Finish → run saved with real distance, splits list, route trace drawn
- [ ] Route trace also appears on the run's Share Card
- [ ] Weekly summary/mileage and pace PRs update from the GPS run

## 4. Health sync (dev build only)

- [ ] Profile → Health Sync shows "Apple Health is ready" (not the Expo Go note)
- [ ] Connect → iOS permission sheet → grant all
- [ ] Finish any workout → appears in the Apple Health app (rings credit)
- [ ] Record a workout on Apple Watch → open ReviveX → auto-import pulls it in
      (or tap Import) — no duplicates on repeat imports
- [ ] Workout/run detail shows Avg HR / Max HR / Energy when the watch was worn
- [ ] Toggles: disable Runs sync → new runs stay out of Apple Health

## 5. Body weight + progress

- [ ] Log weight → summary, trend bars, history row appear
- [ ] Progress tab shows Body Weight card with change values
- [ ] Milestones: streak flame correct; badges earned match history
- [ ] PR History and per-exercise trend screens open from Progress

## 6. Sharing + data

- [ ] Share Card → Share Image exports a PNG with stats (and route for runs)
- [ ] Profile → Export My Data → share sheet delivers a JSON with everything

## 7. Persistence + stability

- [ ] Force-quit and relaunch: all data still present (workouts, runs, hybrid,
      weight, health settings, streaks)
- [ ] Update from a previous build (don't delete the app): old data intact
- [ ] Airplane mode: everything except health/GPS still works; no crashes
- [ ] Every tab and detail screen opens; back navigation never dead-ends

## Known-acceptable for beta

- App icon is upscaled from brand-board art (swap designer 1024px master
  into assets/icon.png before App Store release).
- Health sync/import and background GPS are silent no-ops in Expo Go by design.
- No cloud backup/social — local-only by design for v1.
