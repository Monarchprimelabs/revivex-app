# Direction A feature backlog (Revive X hybrid tracker)

Priority: must, should, nice. Status: done, partial, todo. Updated 2026-10-11 after step 4e. The vertical slice in step 3 covers the rows marked "slice".

| Feature | Priority | Status | Notes |
| --- | --- | --- | --- |
| Sign in and sign up with email and password | must (slice) | done | Account & Sync screen from Profile, reusing the existing session |
| Log a strength workout and see it in history and detail | must (slice) | done | Existing logger, history list and detail screen |
| Mirror workouts, runs, hybrid sessions, routines and body weight to Supabase | must (slice for workouts) | done | Outbox per table, upsert by device id, pull on sign-in, foreground and every minute. GPS traces in their own table |
| Sync indicator on list and detail | must (slice) | partial | Workout history card and detail. Run, hybrid and routine screens still to get the chip |
| Shared schema with RLS and policy tests | must | done | `db/schema.sql`, 68 checks in `db/tests` |
| Account deletion from inside the app | must | done | Edge Function `delete-account` plus a confirm flow on the account screen. Needs deploy from the Mac |
| Open-source font in the design system | must | partial | Inter loads in both apps and drives shared components. Direction A screens keep the platform font until a typography pass |
| Background-safe rest timer | must | partial | Timer exists. Needs a device check and a local notification at zero |
| Privacy-safe sharing | must | partial | Schema rejects route points in posts. Client share flow still to build on the new tables |
| Strava connect and push for runs, workouts, hybrid sessions | should | done | Edge Functions, connection screen, Post to Strava on detail screens. Needs the owner's Strava API app, subscription and secrets to run |
| Set types (warm-up, drop, failure) and RPE | should | partial | Set types shipped: tap the set number to cycle, warm-ups excluded from volume and records, marked in Strava descriptions. RPE field exists in the model, no input yet |
| Supersets | should | todo | Category table stakes per recon |
| Custom exercises | should | todo | `exercise_templates` table exists |
| Feed, likes, comments on the new visibility model | should | todo | Posts default to followers. Follow requests supported by schema |
| Follow requests and private profiles | should | todo | `follows.status` supports pending |
| Weekly summary and PR history | should | done | Existing |
| Playwright end-to-end flow for the slice | should | done | `npm run e2e:full`, three scenarios |
| FIT upload with per-set data to Strava | nice | todo | After basic push works |
| Hevy bring-your-own-key import | nice | todo | Pro-only on Hevy's side, no API terms. Convenience only |
| Routine folders | nice | todo | Hevy complaint theme |
| Progress photos | nice | todo | Needs Supabase Storage and privacy rules |
| Hevy-style "last time" and plate calculator | - | done | Existing |
| HYROX race simulation | - | done | Existing differentiator |
| Health sync and GPS tracking | - | done | Existing, dev build only |
| Subscription rails | - | done | Dark launched, nothing gated |
