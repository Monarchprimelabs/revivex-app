# Direction B feature backlog (Revive X daily coach)

Priority: must, should, nice. Status: done, partial, todo. Updated 2026-10-11 after step 3. The vertical slice in step 3 covers the rows marked "slice".

| Feature | Priority | Status | Notes |
| --- | --- | --- | --- |
| App scaffold on the shared design system | must | done | Root layout and Today placeholder |
| Sign in and sign up with email and password | must (slice) | done | Shared backend factory, same auth as Direction A |
| Three-tap readiness check-in (sleep, soreness, energy) | must (slice) | done | One per day, stored locally and in `readiness_checkins` |
| Rules engine package `@revivex/coach` with unit tests | must (slice) | done | Deterministic, versioned, no LLM. Rules in architecture section 8 |
| Today screen: plan card with blocks and rationale | must (slice) | done | Single home screen |
| Mark complete, saving a workout, run or hybrid session | must (slice) | done | Writes the same shapes as Direction A, mirrored to the shared tables |
| History list and plan detail screen | must (slice) | done | Reads local store, shows sync state |
| Mirror check-ins, plans and sessions to Supabase | must (slice) | done | Same outbox pattern as Direction A |
| Profile basics: focus, weekly target, experience, units | must | done | Inputs the engine needs. Captured on first launch |
| Open-source font in the design system | must | done | Inter throughout Direction B |
| Account deletion from inside the app | must | done | Shared Edge Function |
| Adjust today's plan: swap an exercise, shorten the session | should | todo | Addresses the rigidity complaints in the recon |
| Weekly strip showing completed slots | should | done | Makes the rotation visible |
| Local reminder notification for the check-in | should | todo | `expo-notifications`, no server push |
| Streaks and simple adherence stats | should | todo | Reuse core achievements where they fit |
| Playwright end-to-end flow for the slice | should | done | Pending decision 4 in the architecture doc |
| Import history from a Direction A export file | nice | todo | Same JSON shape, lets testers seed the engine |
| Post completed sessions to Strava | nice | todo | Shared push backend once Direction A has it |
| Read sleep from Apple Health or Health Connect to prefill the check-in | nice | todo | Dev build only |
