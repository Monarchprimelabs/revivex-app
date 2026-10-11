# Direction A feature backlog (Revive X hybrid tracker)

Priority: must, should, nice. Status: done, partial, todo. Updated 2026-10-11 at step 2. The vertical slice in step 3 covers the rows marked "slice".

| Feature | Priority | Status | Notes |
| --- | --- | --- | --- |
| Sign in and sign up with email and password | must (slice) | partial | Exists behind the Community screen. Needs a reachable entry from Profile and a signed-out state on Home |
| Log a strength workout and see it in history and detail | must (slice) | done | Existing logger, history list and detail screen |
| Mirror workouts, runs, hybrid sessions, routines and body weight to Supabase | must (slice for workouts) | todo | Outbox per context, upsert by client id, pull on sign-in |
| Sync indicator on list and detail | must (slice) | todo | Local only, synced, pending |
| Shared schema with RLS and policy tests | must | done | `db/schema.sql`, 66 checks in `db/tests` |
| Account deletion from inside the app | must | todo | App Store requirement. Edge Function `delete-account` plus local wipe |
| Open-source font in the design system | must | todo | Inter via `@expo-google-fonts/inter`, loaded once in the design system |
| Background-safe rest timer | must | partial | Timer exists. Needs a device check and a local notification at zero |
| Privacy-safe sharing | must | partial | Schema rejects route points in posts. Client share flow still to build on the new tables |
| Strava connect and push for runs, workouts, hybrid sessions | should | todo | Edge Functions and connect UI. Needs the owner's Strava API app and subscription |
| Set types (warm-up, drop, failure) and RPE | should | todo | Category table stakes per recon |
| Supersets | should | todo | Category table stakes per recon |
| Custom exercises | should | todo | `exercise_templates` table exists |
| Feed, likes, comments on the new visibility model | should | todo | Posts default to followers. Follow requests supported by schema |
| Follow requests and private profiles | should | todo | `follows.status` supports pending |
| Weekly summary and PR history | should | done | Existing |
| Playwright end-to-end flow for the slice | should | todo | Pending decision 4 in the architecture doc |
| FIT upload with per-set data to Strava | nice | todo | After basic push works |
| Hevy bring-your-own-key import | nice | todo | Pro-only on Hevy's side, no API terms. Convenience only |
| Routine folders | nice | todo | Hevy complaint theme |
| Progress photos | nice | todo | Needs Supabase Storage and privacy rules |
| Hevy-style "last time" and plate calculator | - | done | Existing |
| HYROX race simulation | - | done | Existing differentiator |
| Health sync and GPS tracking | - | done | Existing, dev build only |
| Subscription rails | - | done | Dark launched, nothing gated |
