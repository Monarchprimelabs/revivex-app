# Test report (step 5)

Updated 2026-10-12 on branch `claude/two-directions`. Everything below ran in the cloud sandbox. Device runs, Expo Go, and sync against a live Supabase project have not happened yet and are the first items on the Mac checklist in `CLAUDE_HANDOFF.md`.

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
| `packages/core` | Plate math, weekly summary, last performance, GPS engine, workout-to-routine, achievements, route projection, HYROX plan, set types, export parsing | 79 checks pass |
| `packages/backend` | Config checks, row mappers for every mirrored table, outbox reconcile, flush, failure and retry, fresh-only automatic flushes, pull and last-write-wins merge, tombstones across devices, recovery when the app closes mid-sync | 80 checks pass |
| `packages/coach` | Readiness bands, week templates, slot selection, fatigue skip, readiness gates, progressive overload, run prescriptions, determinism, plan-to-activity conversion, swap and shorten adjustments, completion builders | 67 checks pass |
| `apps/direction-a` | Health import mapping | 12 checks pass |
| `db/tests` | RLS as three users, an anonymous client and the service role, tombstones, idempotent schema | 73 checks pass |
| `supabase/tests` | Strava payload mapping, GPX building, token refresh timing, scopes, return-link allowlist | 19 checks pass |
| Playwright, Direction A | Fresh install starts onboarding; log a workout through start, add exercise, set-type cycling, set entry, finish, detail, history, detail again; profile to account screen with cloud status | 3 scenarios pass |
| Playwright, Direction B | First launch asks for setup; setup, check-in, plan, swap an exercise, shorten, log what was actually done (edited reps, an unfinished set, a skipped exercise, time), history, detail; skip and rebuild; account screen | 4 scenarios pass |
| Playwright, live sync against a local Supabase stand-in (`npm run e2e:mock`) | Two browser contexts as two devices: sign up, log or complete a session, see it reach Synced, sign in on the second device and find it there, for both apps | 2 scenarios pass |
| Playwright, live sync against the real project (`npm run e2e:live`) | Same scenarios against the owner's Supabase project | Not run yet: needs the project. First item in `docs/codex-runbook.md` step 3 |
| Metro export, iOS | Both apps bundle | Pass |
| Metro export, web | Both apps bundle | Pass |

## Bugs found in this pass

1. **Direction A would not bundle for web.** `react-native-maps` imports native-only React Native internals, so `expo export --platform web` failed. Steps: run the export in `apps/direction-a` before commit `f33e1ae`. Fix: a Metro web resolver maps the five native-only packages to empty modules. Status: fixed.
2. **Lazy native loaders accepted an empty module.** With the web stubs in place, the HealthKit, Health Connect and purchases loaders would have treated `{}` as a working module and called undefined functions. Fix: each loader now checks for the function it needs and reports the feature unavailable otherwise. Status: fixed.
3. **Playwright storage seeding wiped state on reload.** `addInitScript` runs on every document load, so a `page.goto()` mid-test cleared the workout just logged. Not an app bug. Fix: seed once per browser context. Status: fixed.

4. **Sync could read a pulled record as deleted after the app closed mid-sync.** The sync bookkeeping was saved before the merged records. If the app closed between the two writes, the next launch saw a tracked record missing from the collection and pushed a delete, tombstoning it on every device. The same window could push an older copy over a newer server version, or resurrect a record deleted elsewhere. Steps: pull on a second device and kill the app between the two writes (simulated in `packages/backend/tests/sync.test.ts`). Fix: pulled changes are provisional until a reconcile pass sees them in the collection, sync state is saved after the data writes, and an unconfirmed pull is re-fetched instead of being pushed or deleted. Status: fixed, covered by three crash-recovery scenarios.
5. **GPS runs would echo between devices forever.** A run's fingerprint included its GPS points, which arrive through a separate table, so attaching a trace looked like an edit and each device pushed the run back. Fix: runs are mirrored without their points and route records carry no timestamp. Status: fixed, covered by mapper tests.
6. **One failed push could stall automatic syncing for a minute, and a long offline queue could retry in a loop.** Fix: automatic pushes only take entries that have not failed, re-arm after every sync until the fresh queue is empty, and leave failed entries to the minute timer, foreground or Sync now. Status: fixed.
7. **The web build kept a stale app config.** Metro's transform cache reused a bundle exported before the keys were set. Fix: `export:web` always clears the cache. Status: fixed.
8. **Local Supabase URLs were rejected.** The config check required https, which also blocked the Supabase CLI's local stack. Fix: plain http is accepted for localhost and private LAN addresses only. Status: fixed.

9. **Expo Doctor flagged three patch versions behind SDK 54.** Found on the Mac (the cloud sandbox cannot reach Expo's servers). Fix: expo 54.0.37, expo-constants 18.0.14, expo-file-system 19.0.24 in both apps; every Expo-pinned package was checked offline against the new release's bundled versions, and the full suite passed again. Status: fixed.

No other defects were found in the app logic exercised by the suites.

## Mac run 1 (Codex on the owner's Mac mini, 2026-10-12)

| Check | Result |
| --- | --- |
| Install, typecheck, unit and policy suites | Pass, same counts as the cloud |
| Expo Doctor | 17/18: three patch versions behind; fixed on the branch afterwards |
| Web and iOS exports | Fail: Metro could not resolve `expo-router/build/qualified-entry` although the file exists |
| Simulator | Fail: Expo CLI could not download Expo Go (`fetch failed`) |
| Playwright browser install | Stalled during extraction |

The export failure did not reproduce in the cloud with the same commit under Node 22 or Node 26 (the Mac runs 26.4). Codex's log shows watchman dropping events and recrawling the repository, and the clone sits on the Desktop, which macOS commonly syncs to iCloud. The second run uses a fresh clone outside the Desktop with watchman reset; `docs/codex-runbook.md` lists fallbacks for the Expo Go download and the Playwright browser. Live sync against the real project and the phone session are still pending. The coach engine's fatigue rule was calibrated during testing: a single four-set accessory does not block a slot, a full session (six or more sets on the slot's muscle groups inside 48 hours) does.

## Known limitations and what is not covered

- Sync has not run against a live Supabase project. It has run end to end against a local stand-in that emulates the auth and REST endpoints the apps use (`npm run e2e:mock`); real-project behavior (RLS, triggers, PostgREST) is covered by `npm run e2e:live`, which needs the owner's project.
- Native-only paths (GPS tracking, Health sync, maps, purchases) are excluded from the web suites and stay on the device checklist in `docs/TESTING.md`.
- React Native's `Alert` is a no-op on web, which affects the discard-workout and finish-without-timer guards in Direction A on web only.
- On web, screens below a modal stay mounted, so tests select the topmost match. Native behavior is unaffected.
- Expo Go behavior and Inter font rendering on device have not been seen in this sandbox.
- The Direction B history import is unit-tested at the parser level; the file picker itself was not exercised in Playwright.
