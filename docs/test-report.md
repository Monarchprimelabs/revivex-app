# Test report (step 5)

Updated 2026-10-11 on branch `claude/two-directions`. Everything below ran in the cloud sandbox. Device runs, Expo Go, and sync against a live Supabase project have not happened yet and are the first items on the Mac checklist in `CLAUDE_HANDOFF.md`.

## How to run

```bash
npm run typecheck     # every workspace
npm test              # unit suites: core, backend, coach, Direction A device mapping, Strava helpers
npm run test:db       # schema and row-level security in PGlite
npm run e2e:full      # export both apps for web and run Playwright at phone width
```

## Results

| Suite | What it covers | Result |
| --- | --- | --- |
| Typecheck | 7 workspaces (2 apps, 5 packages) | Clean |
| `packages/core` | Plate math, weekly summary, last performance, GPS engine, workout-to-routine, achievements, route projection, HYROX plan, set types | 74 checks pass |
| `packages/backend` | Row mappers round trip for every mirrored table, outbox reconcile, flush, failure and retry, pull and last-write-wins merge, tombstones across two devices, delete protection | 56 checks pass |
| `packages/coach` | Readiness bands, week templates, slot selection, fatigue skip, readiness gates, progressive overload, run prescriptions, determinism, plan-to-activity conversion, swap and shorten adjustments, completion builders | 67 checks pass |
| `apps/direction-a` | Health import mapping | 12 checks pass |
| `db/tests` | RLS as three users, an anonymous client and the service role, tombstones, idempotent schema | 73 checks pass |
| `supabase/tests` | Strava payload mapping, GPX building, token refresh timing, scopes, return-link allowlist | 19 checks pass |
| Playwright, Direction A | Fresh install starts onboarding; log a workout through start, add exercise, set-type cycling, set entry, finish, detail, history, detail again; profile to account screen with cloud status | 3 scenarios pass |
| Playwright, Direction B | First launch asks for setup; setup, check-in, plan, swap an exercise, shorten, log what was actually done (edited reps, an unfinished set, a skipped exercise, time), history, detail; skip and rebuild; account screen | 4 scenarios pass |
| Metro export, iOS | Both apps bundle | Pass |
| Metro export, web | Both apps bundle | Pass |

## Bugs found in this pass

1. **Direction A would not bundle for web.** `react-native-maps` imports native-only React Native internals, so `expo export --platform web` failed. Steps: run the export in `apps/direction-a` before commit `f33e1ae`. Fix: a Metro web resolver maps the five native-only packages to empty modules. Status: fixed.
2. **Lazy native loaders accepted an empty module.** With the web stubs in place, the HealthKit, Health Connect and purchases loaders would have treated `{}` as a working module and called undefined functions. Fix: each loader now checks for the function it needs and reports the feature unavailable otherwise. Status: fixed.
3. **Playwright storage seeding wiped state on reload.** `addInitScript` runs on every document load, so a `page.goto()` mid-test cleared the workout just logged. Not an app bug. Fix: seed once per browser context. Status: fixed.

No defects were found in the app logic exercised by the suites. The coach engine's fatigue rule was calibrated during testing: a single four-set accessory does not block a slot, a full session (six or more sets on the slot's muscle groups inside 48 hours) does.

## Known limitations and what is not covered

- Sync has not run against a live Supabase project. The engine is unit-tested against an in-memory remote and the policies against PGlite. First live run is on the Mac checklist.
- Native-only paths (GPS tracking, Health sync, maps, purchases) are excluded from the web suites and stay on the device checklist in `docs/TESTING.md`.
- React Native's `Alert` is a no-op on web, which affects the discard-workout and finish-without-timer guards in Direction A on web only.
- On web, screens below a modal stay mounted, so tests select the topmost match. Native behavior is unaffected.
- Expo Go behavior and Inter font rendering on device have not been seen in this sandbox.
