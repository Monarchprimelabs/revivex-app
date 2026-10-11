# Direction A vs Direction B (step 6, draft)

Status: draft, written 2026-10-11 before either direction has run on a device or against a live Supabase project. The owner's Mac session (see `CLAUDE_HANDOFF.md`) will confirm or change the device-level observations. Both directions share one backend (`db/schema.sql`), one sync engine (`@revivex/backend`), one design system and one exercise library, so the comparison is about product shape and finish, not infrastructure.

## 1. What each direction is

| | Direction A: Revive X hybrid tracker | Direction B: Revive X daily coach |
| --- | --- | --- |
| One line | Log lifting, running and hybrid sessions in detail, see progress, back it up, post to Strava | Check in, get one session for today built from your history, mark it done |
| Home | Five tabs: Home, Train, Run, Hybrid, Progress | One screen: Today |
| Screens | 40 routes | 7 routes |
| Where the value sits | Breadth and depth of logging, the HYROX race mode, progress analytics | The rules engine and the small daily loop |
| State of build | Phase 50 app plus sync, account, Strava push, deletion | Vertical slice plus adjustments (swap, shorten), sync, account, deletion |

## 2. What each does better

Direction A does better:

- **Depth of logging.** Set-by-set strength logging with rest timer, plate calculator and last-time history, manual and GPS runs with splits and maps, hybrid sessions and a live HYROX race player. Direction B logs a completed plan as written and has no editor.
- **Progress.** Weekly summaries, PR history, per-exercise trends, body weight, streaks and milestone rings. Direction B shows a weekly strip and history counts.
- **Integrations.** Apple Health and Health Connect, GPS tracking, Strava push, the subscription rails. Direction B has none of these yet, although the shared backend means Strava push would cost a day to add.
- **Category fit.** It covers Hevy's core loop and a slice of Strava's record loop, and the HYROX mode is something none of the three reference apps has.

Direction B does better:

- **Time to value.** Setup is one screen with defaults, the check-in is three taps, and a plan appears with its reasons. No empty-state problem: the engine produces a sensible first week with zero history.
- **The thing the category lacks.** Recon found reviewers saying Hevy "doesn't coach" and STNDRD's programs are rigid. Direction B generates, explains, adapts to readiness, skips fatigued muscle groups, and lets the user swap or shorten without losing the week.
- **Testability and safety.** The engine is pure, deterministic and versioned (56 unit checks). No LLM, so no Strava policy exposure, no API cost, works offline.
- **Scope discipline.** Seven screens means every screen can be finished to a high standard quickly, and the comparison with STNDRD's "pay to peek" is easy to win: everything is usable before sign-in.

## 3. What each does worse

Direction A:

- **Breadth without finish.** Several must-haves from the category table stakes are still missing from the logger (set types, RPE, supersets, custom exercises), and the typography pass has not reached its screens. Many screens were built over 50 phases by different sessions; consistency varies.
- **Complexity cost.** Every new feature touches contexts, screens and sync. Native modules mean device builds for the interesting parts (GPS, Health, maps), which Expo Go and web cannot exercise.
- **Weak hook.** "A tracker" competes head-on with Hevy and Strava on their strongest ground. The HYROX mode is the only hook that is clearly its own.

Direction B:

- **Thin logging.** The completion editor records loads, reps, unfinished sets and skipped exercises, but there is no live logger with a rest timer, no free-form sessions outside the plan, and no editing after the fact. Users who want to train off-plan still need Direction A's logger.
- **Rules need calibration with real data.** Progression percentages, fatigue thresholds and run volume caps are reasonable defaults, not validated against users. The versioned engine makes revision cheap, but the first weeks need a feedback loop.
- **Less to show today.** No charts, no PRs, no sharing. For a user who already logs in Hevy or Strava, Direction B asks them to trust a plan without seeing their history in it until they import or log for a few weeks.

## 4. Effort to finish (to a store-ready v1)

Rough, in working sessions of the kind used so far. Shared items (Supabase project, Sign in with Apple, privacy policy update, store assets) are excluded because both need them.

| Work | Direction A | Direction B |
| --- | --- | --- |
| Logging completeness | 3 (RPE, supersets, custom exercises, sync chips on remaining lists) | 2 (live rest timer during a plan, off-plan sessions, edit after saving) |
| Coaching | 0 (not in scope) | 2 (rule calibration, run pace guidance from check-ins, notifications for the check-in) |
| Progress and history | 1 (polish) | 2 to 3 (per-exercise trends and PRs from the shared core utilities, weekly review) |
| Integrations | 1 (Strava verification with the owner's app, Health regression) | 1 to 2 (Strava push reuse, Health read for sleep in a dev build) |
| Visual finish | 2 to 3 (typography across 40 screens, consistency pass) | 1 |
| Device testing and fixes | 2 | 1 |
| **Total** | **8 to 10** | **9 to 11** |

The totals are close because Direction B must grow a logger while Direction A must finish one. Direction A's remaining work is mostly known patterns; Direction B's includes product decisions (how much editing to allow before it becomes a second tracker).

## 5. Fit with the reference-app research

| Recon finding | Direction A | Direction B |
| --- | --- | --- |
| Table stakes: fast logging with previous values, set types, rest timer | Mostly there, set types missing | Not applicable until the editor exists |
| Table stakes: routines or programs | Routines exist, no programs | Programs are implicit in the weekly template; no user-authored routines |
| Table stakes: per-exercise history and PRs | Yes | Not yet (shared utilities make it cheap) |
| Table stakes: GPS record that survives lost signal, privacy zones | GPS yes, privacy zones no | Not applicable |
| Complaint: paywall nagging, pay to peek | Everything free, rails dark | Everything free |
| Complaint: free caps on history | No caps | No caps |
| Complaint: background rest timer | Timer exists, device check pending | No timer yet |
| Complaint: lost logs after crashes | Logger keeps the in-progress session in memory only | Completion editor is a single save; plans and check-ins persist as they are made |
| Complaint: rigid program days | Not applicable | Solved by design: next slot, skip, swap, shorten |
| Complaint: "logs but doesn't coach" | Not addressed | The whole product |
| API constraints: Strava push only, no AI on Strava data | Compliant by design | Compliant; the engine never sees Strava data |
| What cannot be cloned: networks, segments, coach brand | Does not depend on them | Does not depend on them |

## 6. Recommendation (not a decision)

The two directions are not really competitors; they are two layers of one product. Direction B is the front door the category is missing and the strongest story for a new app. Direction A is the depth that keeps a serious athlete once they are in, and it already exists.

If one has to lead, the evidence favors leading with Direction B's loop and letting it borrow Direction A's logger piece by piece (the completion editor is the first piece), rather than finishing Direction A's breadth and adding a coach tab later. The shared packages were built so that either order works. The decision that matters is which loop the home screen opens on, and that is the owner's call after a week of using both on a phone.

Open questions the device week should answer: Does the three-tap check-in get done daily, or skipped? Does the plan feel right on days two to seven? Which Direction A screens does a Direction B user actually miss?
