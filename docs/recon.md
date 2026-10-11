# Revive X: Reference App Recon

Step 1 of the two-direction plan. This document records what is publicly verifiable about three reference apps (Strava, Hevy, and The Standard by CBUM, whose store name is STNDRD), what their official APIs permit, what their users praise and complain about, and where the current Revive X build sits relative to the category.

It is research for category understanding only. Nothing here is a layout, asset, copy, or code to reproduce. Revive X keeps its own name, palette, voice, icon set, and fonts in both directions.

Prepared 2026-10-11 on repository commit `d027491`.

## How to read this document

| Tag | Meaning |
| --- | --- |
| VERIFIED | Attributed to an official page (site, help center, store listing, developer docs, legal page) and cited by source number |
| SECONDARY | Reported only by press, a reviewer, a teardown site, or a community post. Treat as likely but not confirmed |
| UNVERIFIED | Could not be confirmed from any public source in this pass. Do not build on it without checking |

Source numbers are prefixed per app: SV for Strava, HV for Hevy, TS for The Standard. The full tables are in section 8.

### Method and its limits

Research rules followed: public sources only, no logins, no scraping or crawling, no reading of app bundles or private endpoints, no verbatim marketing copy. Short verbatim quotes appear only for user reviews, with attribution. Access date for every source is 2026-10-11 unless a row says otherwise.

One limitation applies to the whole document. The cloud sandbox this was researched from denies outbound connections to the store and vendor hosts (apps.apple.com, play.google.com, strava.com and its support and developer subdomains, hevyapp.com and its help and API subdomains, stndrd.app, reddit.com). Every "VERIFIED" row therefore means the claim appeared in a search-engine excerpt attributed to the named official page, not that the page was read in full. Consequences:

- No store screenshots were viewed, so no screen is screenshot-verified. The strongest tier available is listing-text, help-doc, or developer-doc verification.
- Reddit was unreachable. Community sentiment comes from mirrors, aggregators, forums and press.
- The Strava API Agreement and API Policy were read as excerpts. Their exact clause text must be read in full before the Strava integration is designed (see section 5).
- Ratings, prices and review counts are snapshots and move. Re-check before quoting externally.

To close these gaps, allow the hosts above in the environment's network settings, or run the re-verification list in section 7 from a machine with open access.

## Contents

1. Category summary and what it means for Revive X
2. Strava
3. Hevy
4. The Standard by CBUM (STNDRD)
5. Official API and terms constraints
6. Where the current Revive X build sits in the category (Direction A baseline)
7. Open and unverified items
8. Sources

## 1. Category summary and what it means for Revive X

### 1.1 Three segments, one converging category

| App | Core loop | Price points (US) | Scale claim | Evidence |
| --- | --- | --- | --- | --- |
| Strava | Record an activity, share it to a feed, compete on segments and challenges | $11.99 per month, $79.99 per year, family $139.99, student $39.99 | 200M+ users (July 2026) | SV-2, SV-32 |
| Hevy | Log sets fast against previous numbers, reuse routines, watch per-exercise progress | $2.99 per month, $23.99 per year, $74.99 lifetime, generous free tier | 11M+ users | HV-2, HV-6, HV-27 |
| STNDRD | Follow a coach-authored program week by week, log the session, eat to macro targets | $19.99 per month or $79.99 per year, everything behind the paywall | 150,000+ members | TS-1, TS-7 |

The three started in different corners and are converging. In 2026 Strava shipped a strength workout log with muscle maps, Instant Workouts and AI insights (SV-32). Hevy shipped an algorithmic program generator and full-detail Strava sync (HV-4, HV-5). STNDRD added a community feed, chat and an XP leaderboard (TS-1, TS-7). Each now bundles log, plan and community. For a new entrant, feature breadth is no longer a differentiator. Execution on a small number of loops plus a clear angle is.

### 1.2 Table stakes that recur across all three

- Fast logging with previous values shown inline, set types, a rest timer that keeps running in the background, and crash-safe persistence of an in-progress session (HV-14, HV-16, TS-2 complaints).
- Routines or programs with notes, rest, rep ranges and some way to organize them (HV-10, TS-6).
- Per-exercise history with PRs and estimated one-rep max, and a calendar or training log (HV-12, HV-13, SV-13).
- GPS record-to-save that survives a lost signal and no network, with offline upload queueing (SV-7, SV-16).
- Privacy tiers per activity, start-end masking and privacy zones for anything with a map (SV-8).
- Health and watch sync, plus file or CSV export (HV-7, HV-17, SV-16).
- A free tier that is actually usable, a trial, and a cancel path that does not generate one-star reviews (all three review sections).

### 1.3 Recurring complaints, and the opening each one leaves

| Complaint | Seen at | Opening for Revive X |
| --- | --- | --- |
| Paywall nagging and features moving behind the subscription | Strava (28.7% of negative Play reviews in one 2026 sample), STNDRD (pay to peek) | Keep logging free forever, as Phase 50 already decided, and never interrupt a session with an upsell |
| Free caps that feel punitive | Hevy (4 routines, 3 months of history) | Cap breadth, not history. Users should never lose sight of their own past |
| Rest timer stops when the app is backgrounded | STNDRD | Background-safe timer with a local notification, tested on device |
| Crashes that lose a half-finished workout | STNDRD | Persist every set as it is entered, resume on relaunch (Hevy does this) |
| GPS failing to record or drifting | Strava | Foreground and background tracking already exist in Revive X. Test the lost-signal and airplane-mode paths explicitly |
| Programs that assign fixed days and cannot be moved | STNDRD | Any plan Revive X generates must reschedule and skip without breaking |
| Watch and sync data mismatches | Hevy | Keep one source of truth per activity and show provenance on imported items |
| Billing and cancellation friction | STNDRD, Strava | Store-managed subscriptions only, manage-subscription link one tap from Profile |
| Logging without coaching | Hevy ("it doesn't coach") | The gap a daily-plan direction would fill |

### 1.4 What cannot be cloned

Networks, datasets and brands: Strava's social graph, segment and heatmap data, and device partnerships (section 2.6); Hevy's social graph and its licensed exercise animations (section 3.7); STNDRD's coach brand, program IP and video library (section 4.7). Revive X competes on its own loops, its own content, and the hybrid angle none of the three owns.

### 1.5 What the API picture allows

- Strava: push Revive X activities to Strava freely. Pull Strava data only for the owner's eyes, cached for at most 7 days, never into an AI feature, never into a feed or leaderboard. The developer needs a Strava subscription and an app review before more than 10 athletes can connect (section 5.1).
- Hevy: an official API exists, but it is Pro-only, keyed per user, has no delete endpoints, no documented rate limits and no API-specific terms. Fine as a bring-your-own-key import, not as a foundation (section 5.2).
- STNDRD: no API (section 5.3).

### 1.6 Where the current Revive X build sits

The repository is at Phase 50 and healthy: it typechecks, 82 unit tests pass, and it covers Hevy's core loop, a slice of Strava's record loop, body weight, streaks, health sync, a HYROX race simulator, Supabase auth with a social schema, and dormant subscription rails. It has nothing from STNDRD's segment (programs, nutrition, coaching) and nothing on recovery or readiness. Its social schema needs a privacy fix before any post is written. Details and the restructure-versus-restart recommendation are in section 6.

### 1.7 What the recon says about each Direction B candidate

This table is evidence from the recon. The proposal that follows it is ours and needs the owner's decision.

| Candidate | What the reference apps show | Data and API reality | Reuse of shared packages | How hard to validate |
| --- | --- | --- | --- | --- |
| 1. Recovery-first (sleep, soreness, readiness before suggesting a workout) | None of the three does this. Strava's Fitness and Freshness and Relative Effort are the closest, both paid (SV-13). The space is open | Sleep and HRV come from Apple Health or Health Connect, which are dormant in Expo Go and need a dev build. Manual check-ins work everywhere but are subjective. Strava data cannot feed trend math beyond a 7-day cache | Medium. New entities (check-ins, readiness), reuses logging and theme | Medium. Value depends on wearable data many users will not have |
| 2. Single-screen daily coach (one workout per day from logged history) | The whole category is moving here: Hevy Trainer (Pro), Strava Instant Workouts (paid), STNDRD programs. Demand is validated by three paid tiers. Reviewers want flexibility (STNDRD rigidity) and coaching (Hevy "doesn't coach") | Can be a deterministic rules engine (progressive overload, weekly target, lift-run-hybrid rotation) with no LLM, which keeps it clear of Strava's AI ban and of the repository's no-AI-coach rule. Works fully offline on native data | High. Exercise library, workout, run and hybrid types, stats utilities, design system | Easiest. Pure functions, unit-testable, no network needed |
| 3. Community challenge app (group goals over individual logging) | Strava Group Challenges are paid (SV-12), STNDRD has challenges and an XP leaderboard (TS-7), Hevy has a feed (HV-11). Demand exists | Strava data may not be shown to other users, so challenges can only count natively recorded activity. Strava itself excludes manual activities from challenge leaderboards for anti-cheat reasons, a problem Revive X would inherit (SV-12) | Medium. Direction A already has the social schema, so the two directions would overlap | Hardest. Needs real users to feel alive, plus moderation and abuse handling |

Proposal for Direction B: candidate 2, with a three-tap readiness check-in (sleep, soreness, energy) borrowed from candidate 1 as the single input that adjusts the day's session. It is the most different from Direction A's breadth, the most reusable, the only one that is fully testable without users or wearables, and the one that addresses the two loudest review themes (rigidity and absence of coaching) for the hybrid athlete none of the three serves. Candidate 3 is the weakest fit because the API terms and the need for a live network both work against it.

## 2. Strava

### 2.1 Positioning and pricing

Strava's current press boilerplate calls it "the app for active people" and cites 200M+ users in 185+ countries (July 2026). Earlier 2026 releases said 180M in January and 195M in May and June (SV-32). The help center frames the free product as recording and sharing activities with a community, with a paid subscription layering on analysis, routes and training tools (SV-3, SV-12). Strava-owned Runna (run coaching) is sold as a bundle (SV-18, SV-32).

US pricing. Most official pricing pages are about 15 months old.

| Plan | Price | Source | Status |
| --- | --- | --- | --- |
| Individual monthly | $11.99 per month | SV-2 (page dated 2025-07-01) | VERIFIED |
| Individual annual | $79.99 per year plus tax, 30-day trial shown | SV-1, SV-2 | VERIFIED |
| Family (up to 4) | $139.99 per year | SV-1, SV-18, SV-32 | VERIFIED |
| Student (verified, 16+) | $39.99 per year | SV-1, SV-18 | VERIFIED |
| Strava plus Runna bundle (annual only) | $149.99 per year | SV-1, SV-18, SV-32 | VERIFIED |
| Discounts | 25% off for teachers, military, medical | SV-1 | VERIFIED |
| Trials | Eligibility-based free trial, plus a complimentary 30-day "Subscription Preview" auto-activated on select free accounts with no card | SV-18 | VERIFIED |
| Last large increase | February 2023, from $7.99 to $11.99 monthly and $59.99 to $79.99 annual | SV-40 | SECONDARY |

A community post citing $94.99 per year and $14.99 per month (April 2026) could not be matched to an official page. UNVERIFIED, possibly non-US. App Store IAP snapshots list $11.99, $79.99, $139.99 and $149.99 (SV-34).

Subscription gating:

| Feature | Free | Subscriber | Source |
| --- | --- | --- | --- |
| Record, upload, share, kudos, clubs, public challenges | Yes | Yes | SV-3, SV-12 |
| Segment leaderboards | Top 10 only | Full, with date, age, weight, followers and club filters | SV-4 |
| Live Segments | Progress on map | Adds PR and KOM comparison | SV-4 |
| Local Legend | See the leader | Compare efforts | SV-4 |
| Suggested routes, route builder (web and mobile), offline routes | No, but anyone can save and follow a shared route | Yes | SV-3, SV-10 |
| Heatmaps | Global | Adds Personal, Weekly, Night | SV-5 |
| Beacon | Yes in the phone app | Adds device Beacon (compatible watches) | SV-3, SV-6 |
| Goals, Training Log, Fitness and Freshness, Relative Effort, matched activities, grade-adjusted pace, training plans | No | Yes | SV-3, SV-13 |
| Group Challenges (create and join) | No | Yes | SV-12 |
| Athlete Intelligence, Instant Workouts, off-route alerts | No | Yes | SV-14, SV-32, SV-33 |
| Year in Sport recap, full Month in Sport | Reduced Month in Sport | Yes | SV-13, SV-40 |
| Bulk file upload (web) | 15 files per batch | 25 files per batch | SV-16 |
| MCP connector for AI assistants | No | Yes | SV-14, SV-32 |
| Streaks, dark mode, messaging | Yes (messaging gating UNVERIFIED) | Yes | SV-13, SV-17, SV-8 |

### 2.2 Screen inventory

Bottom tabs referenced by help docs: Home, Maps, Record, Groups, You (SV-4, SV-7, SV-9, SV-12, SV-13). HD = help-doc-verified, PR = official press or blog. No screen is store-screenshot-verified because screenshots could not be viewed from this sandbox.

| ID | Screen | How you get there | Purpose | Key components | States seen | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| SV-S01 | Sign up / log in | Launch | Account | Google, Apple (Hide My Email by default), email and password or an emailed one-time code. Facebook login removed | UNVERIFIED | HD (SV-17) |
| SV-S02 | Onboarding and defaults | After sign-up | Profile and privacy | Adult defaults: profile and activities visible to Everyone, Flyby to No One, Training Log private, messages from Following. Under 18: followers only, 400 m map hide, no messaging | Permission prompts UNVERIFIED | HD (SV-8) |
| SV-S03 | Home feed | Home tab | Social feed | Own and followed athletes' activities, filter (you, followers, clubs), Personalized vs Latest ordering, club posts, challenge and goal events, achievement banners, notifications | Empty and error states UNVERIFIED | HD (SV-9) |
| SV-S04 | Record (pre-start) | Record tab | Set up recording | Sport picker, slide-up menu (auto-pause by sport, Beacon), paired sensors, Start. A route's Start loads navigation here | - | HD (SV-6, SV-7, SV-10, SV-16) |
| SV-S05 | Recording | Start | Live tracking | Timer, distance, pace, Live Segment progress (free) with comparisons (paid), off-route buzz (paid), Beacon live | Weak-GPS state UNVERIFIED | HD (SV-4, SV-6, SV-7), PR (SV-33) |
| SV-S06 | Paused | Pause or auto-pause | Hold | Manual pause needs manual resume even with auto-pause. Indoors can falsely auto-resume | - | HD (SV-7) |
| SV-S07 | Save / edit activity | Finish | Finalize | Title, sport and run type, tags, map type, perceived exertion, gear, description, private notes, photos, visibility, mute (hide from feeds), Save or Discard (irreversible) | - | HD (SV-7, SV-15) |
| SV-S08 | Activity detail | Feed card or You tab | Review | Map, stat box, Athlete Intelligence summary and "Say More" (paid), splits, laps, segments list, best efforts, matched runs, photos, kudos count, comments. Menu: edit, delete, crop or split, correct distance (web) | - | HD (SV-14, SV-15, SV-16) |
| SV-S09 | Kudos list / comments | Tap kudos count or comment icon | Social | Kudoer list, threaded comments on activities, posts, achievements and challenge entries, mentions. No kudos undo | - | HD (SV-9) |
| SV-S10 | Profile / You tab | You tab | Self | Progress (summary chart, goals, training-log preview), Activities with search and filter, weekly calendar widget, recent trophies, 90-day sport stats, follower counts, starred segments | - | HD (SV-4, SV-13) |
| SV-S11 | Find and follow athletes | You tab, search | Graph | Search by name, Suggested, Contacts, Follow. Request and approve when the target profile is Followers-only. Block | - | HD (SV-8, SV-9) |
| SV-S12 | Maps / Explore | Maps tab | Discover | Routes or Segments dropdown, sport picker, filters (length, elevation, surface), heatmap layers | - | HD (SV-4, SV-5, SV-10) |
| SV-S13 | Route builder (mobile) | Maps, Routes, create (paid) | Plan | Tap-to-build or manual draw, popular vs direct, elevation preference, paved or dirt, custom waypoints, save. GPX and TCX export is web-only | - | HD (SV-10), mobile steps partly UNVERIFIED |
| SV-S14 | Segment detail / leaderboard | Maps, Segments, or from an activity | Compete | Map, segment competitions (Local Legend, Most Efforts), leaderboard top 10 free or full with filters paid, Your Results, star | - | HD (SV-4) |
| SV-S15 | Clubs | Groups, Clubs | Community | Club info, events, posts, stats, weekly leaderboard (top 10 mobile, top 100 web, resets Sunday 23:59 club time), join or request, create, admin-only posting | - | HD (SV-11) |
| SV-S16 | Challenges | Groups, Challenges | Motivation | Gallery, challenge page with details, eligibility, progress bar, leaderboard, Join. Completed badges go to a Trophy Case. Group Challenge creation (paid, invite up to 199 followers) | - | HD (SV-12) |
| SV-S17 | Training log | You, Progress | History | Weekly rows of circles per activity, filters by sport, time, distance, elevation, tags | - | HD (SV-13) |
| SV-S18 | Goals | You, Progress, Add Goal | Targets | Sport, weekly, monthly or annual, distance, time, count or elevation, suggested goal | - | HD (SV-13) |
| SV-S19 | Settings and privacy controls | You, gear | Config | Subscription, linked services, units, appearance, notifications, Privacy Controls (profile, activities, group activities, Flyby, mentions, map visibility including editing past activities, Metro opt-out), My Apps (web) | - | HD (SV-8, SV-16, SV-17) |
| SV-S20 | Beacon setup | Record menu | Safety | Toggle, up to 3 contacts or copy link. Recipient web page shows live and past location, start time, battery, refresh about every 15 s, ends at save | - | HD (SV-6) |
| SV-S21 | Athlete Intelligence | Activity page (paid, mobile only) | Insight | Summary under the stat box for run, trail, ride, gravel, MTB, walk, hike. "Say More" deep dive, 30-day Relative Effort lookback, hide via feedback. Instant Workouts with 4 intents across 40+ sports | - | HD (SV-14), PR (SV-32) |
| SV-S22 | Subscription paywall | Prompts, Subscribe, Start Free Trial | Monetize | Plan cards, trial if eligible, Preview banner | Layout UNVERIFIED | HD (SV-18), site (SV-1) |

### 2.3 User flows

Tap counts are inferred from help-doc step lists, not observed.

| ID | Flow | Screens | Happy-path taps (estimate) | Edge cases |
| --- | --- | --- | --- | --- |
| SV-F01 | Record a run and save | S04, S05, (S06), S07 | About 4: Record tab, Start, Finish, Save. One more to change sport (SV-7) | GPS lost: Strava cannot backfill, the workaround is a manual activity and deleting the partial one (SV-16). No network: recording continues, upload shows Pending Uploads with Retry, and Unsynced Activities allows delete or GPX export (SV-16). Indoors: obstructed GPS can falsely auto-resume (SV-7). Discard is unrecoverable (SV-7) |
| SV-F02 | Give kudos or comment | S03 or S08, S09 | 1 tap for kudos from the feed, about 3 for a comment (SV-9) | Kudos cannot be undone. Kudos or a comment subscribes you to the thread (SV-9) |
| SV-F03 | Follow an athlete | S10, S11 | 3 to 4 (SV-9) | Followers-only profiles require approval. Blocking removes the follower and hides comments both ways (SV-8) |
| SV-F04 | Build a route and navigate | S12, S13, S04, S05 | 6 plus, UNVERIFIED | Builder is subscriber-only. GPX export only on web (SV-10). Off-route alerts paid (SV-33). Shared routes can be saved and followed by anyone (SV-10) |
| SV-F05 | Join a challenge | Groups, S16 | About 4 (SV-12) | Activities set to Followers or Only You auto-join but cannot complete or rank until set to Everyone. Manual activities do not count toward challenge leaderboards (SV-12, SV-16) |
| SV-F06 | Import from a watch or third-party app | Partner app, Strava OAuth consent, auto-sync | Not applicable | The consent screen lists requested permissions and the user can untick some (SV-16). Apple Health: only Workout-app activities from the past 30 days sync (SV-16). Map-visibility settings are not passed to third parties (SV-16). Duplicate file uploads fail with a "duplicate of activity" error on the API (SV-23). App-side duplicate UX UNVERIFIED. Fallback: web upload of FIT, TCX or GPX up to 25 MB (SV-16) |
| SV-F07 | Set privacy zones | S19, Privacy Controls, Map Visibility | About 5, UNVERIFIED | Hide around an address, hide start and end (default 200 m, 400 m under 18), or hide the whole map. Address and start-end hiding can apply to past activities. The larger zone wins on overlap. Map hiding does not change activity visibility (SV-8) |
| SV-F08 | Start Beacon | S04, S20, S05 | About 4, UNVERIFIED | Contacts need no Strava account. The link dies at save (SV-6) |

### 2.4 Feature list

| Feature | Area | Free or paid | Source | Status |
| --- | --- | --- | --- | --- |
| Phone GPS recording, auto-pause, sensors | Record | Free | SV-7, SV-16 | VERIFIED |
| Apple Watch app with Live Segments | Record | Free, paid comparisons | SV-4, SV-7 | VERIFIED |
| Beacon live location from the phone | Record, privacy | Free. Device Beacon paid | SV-3, SV-6 | VERIFIED |
| Off-route alerts | Record, routes | Paid | SV-33 | VERIFIED |
| Manual activity entry | Record | Free | SV-16 | VERIFIED |
| Strength workout log with muscle maps, Physical Therapy sport type (May 2026) | Record, training | Free for PT type. Muscle-map gating UNVERIFIED | SV-32 | VERIFIED (press) |
| Feed, kudos, comments, mentions, muting | Social | Free | SV-9, SV-15 | VERIFIED |
| Follow, approve, block, Suggested, Contacts | Social | Free | SV-8, SV-9 | VERIFIED |
| In-app messaging (adults) | Social | Gating UNVERIFIED | SV-8 | VERIFIED existence |
| Clubs with posts, events, weekly leaderboard | Social | Free | SV-11 | VERIFIED |
| Public challenges and Trophy Case | Social | Free | SV-12 | VERIFIED |
| Group Challenges | Social | Paid | SV-12 | VERIFIED |
| Suggested routes, route builder, offline routes | Routes | Paid | SV-3, SV-10 | VERIFIED |
| Global heatmap | Routes | Free | SV-5 | VERIFIED |
| Personal, Weekly, Night heatmaps | Routes | Paid | SV-5 | VERIFIED |
| Segment discovery and starring | Segments | Free | SV-4 | VERIFIED |
| Full leaderboards with filters | Segments | Paid, top 10 free | SV-4 | VERIFIED |
| Local Legend comparison | Segments | Paid | SV-4 | VERIFIED |
| Goals, Training Log, Fitness and Freshness, Relative Effort, matched runs, GAP, training plans | Training | Paid | SV-3, SV-13 | VERIFIED |
| Progress chart, streaks, reduced Month in Sport | Training | Free | SV-13 | VERIFIED |
| Year in Sport recap | Training | Paid | SV-13, SV-40 | VERIFIED plus SECONDARY |
| Athlete Intelligence, Instant Workouts, pace zones from a 5K prediction | Training, AI | Paid | SV-14, SV-32, SV-33 | VERIFIED |
| Visibility tiers, hidden stats, map visibility, Flyby and group-activity controls, Metro opt-out, bulk edit of past activities | Privacy | Free | SV-8, SV-15 | VERIFIED |
| Partner device sync (Garmin, Wahoo, COROS, Polar, Suunto, Zwift, Samsung) | Integrations | Free | SV-16, SV-32 | VERIFIED |
| File upload (FIT, TCX, GPX up to 25 MB) | Integrations | Free, batch size differs | SV-16 | VERIFIED |
| MCP connector for AI assistants (read-only) | Integrations, AI | Paid | SV-14, SV-32 | VERIFIED |
| Family, Student and Runna bundle plans | Subscription | - | SV-1, SV-18 | VERIFIED |

### 2.5 Public review themes (opinions, not facts)

Ratings on 2026-10-11: App Store US 4.8 stars, about 365K to 377K ratings depending on snapshot (SV-34). Google Play 4.6 stars, about 1.2M reviews, 100M+ installs, listing updated 2026-10-05 (SV-35). Trustpilot 1.5 of 5 (Strava does not invite reviews there) (SV-36). Product Hunt 4.3 from 23 reviews (SV-37).

| Theme | Quotes | Source and approximate date |
| --- | --- | --- |
| Praise: core tracking and motivation | "a great platform for tracking workouts" and "performance is rock-solid" | App Store (SV-34), undated. Product Hunt (SV-37), undated |
| Praise: social encouragement | "friends can keep up with each other and encourage each other" | App Store (SV-34), undated |
| Praise: watch and device sync | "Strava is my ride buddy! Love it's on Apple Watch." | App Store sample via Kimola (SV-39), undated |
| Praise: segments and maps | Reviewers call mapping and segment features excellent (paraphrase) | SV-34, SV-37 |
| Praise: press verdict | "Still the best training app for runners and cyclists, but it's getting expensive" | TechRadar headline (SV-40) |
| Complaint: paywall prompts | "almost every selection feels like another popup prompting a subscription" and "constantly showing you 'features' they want you to pay to access" | App Store (SV-34), undated. r/Strava via archive (SV-38), March 2026. An analysis of 596 US one-to-three-star Play reviews from April to August 2026 found 171 (28.7%) subscription-related (SV-39) |
| Complaint: GPS and recording failures | "doesn't record even after acquiring GPS signal" and "Location tracking is not even remotely accurate." | App Store (SV-34), Kimola (SV-39). Recent Play reviews cite an error when trying to record (SV-35) |
| Complaint: support, billing, cancellation | "only when I removed app was I then able to find the tiny font hyperlink on strava.com to cancel" | Trustpilot (SV-36), 2026-08-14. Also no reply after two weeks (2026-09-15) and a double charge (2026-08-03) |
| Complaint: features moved behind the paywall | "a lot of personal stats are only available for the paid version" and "subscription creep" | Google Play (SV-35), recent. Year in Sport paywall backlash, December 2025 (SV-40) |
| Complaint: UX and navigation | "UX can sometimes be hard to navigate and understand" and "UI is not intuitive and web version leaves much to be desired" | App Store (SV-34), Product Hunt (SV-37) |

### 2.6 What a new app cannot replicate

| Asset | Why | Status |
| --- | --- | --- |
| Social graph and feed (200M+ users) | Network effect. The API forbids showing other users' data (SV-29, SV-32) | VERIFIED |
| Segment database and leaderboards | No leaderboard endpoint since 2020. Explore Segments restricted to Extended Access from September 2026. Policy bans replicating features (SV-25, SV-28) | VERIFIED |
| Global, weekly and night heatmaps | Built from aggregated public activity. API display rules block re-aggregation (SV-5, SV-29) | VERIFIED |
| Device partner ecosystem | Native connections with Garmin, Wahoo, COROS, Polar, Suunto, Zwift, plus Samsung pre-installs (SV-16, SV-32) | VERIFIED, deal terms SECONDARY |
| Live Segments partner API, Metro | Partner-only programs (SV-25, SV-30) | VERIFIED |
| Club and challenge inventory | Community scale (SV-11, SV-12) | VERIFIED |

### 2.7 Inferred data model

| Entity | Key fields (from API docs) | Source | Confidence |
| --- | --- | --- | --- |
| Athlete | id, resource_state, ftp, weight, clubs, bikes and shoes as gear. Only weight is updatable | SV-24, SV-25 | High |
| Activity | id, name, sport_type (type deprecated), start_date_local, elapsed_time, distance, average and max speed (m/s), gear_id, polyline map, kudos_count, comment_count, achievement_count, athlete_count, photo_count, has_kudoed, trainer, commute, visibility (private flag in webhooks) | SV-22, SV-24 | High |
| Segment | id, name, activity_type, distance, average_grade, maximum_grade, climb_category 0 to 5, start_latlng, starred, hazardous | SV-24, SV-25 | High |
| SegmentEffort | is_kom. Rank fields subscriber-only | SV-24, SV-25 | Medium |
| Route | type, sub_type, estimated_moving_time, segments, waypoints, timestamps | SV-24, SV-25 | Medium |
| Club | member_count, activity_types | SV-24 | Medium |
| Gear | brand_name, model_name, frame_type, primary, distance | SV-24 | High |
| Comment | Returned by the activity comments endpoint with cursor pagination | SV-24, SV-25 | Medium |
| Kudos | Kudoer list with athlete names | SV-24 | Medium |
| Lap | Activity laps endpoint | SV-24, SV-25 | Medium |
| Upload | id, external_id, status, error, activity_id | SV-23 | High |
| WebhookEvent | object_type, object_id, aspect_type, updates {title, type, private, authorized} | SV-22 | High |
| Challenge, Goal, Beacon session, Photo, Streams, Zones | Not confirmed in this pass | - | UNVERIFIED |

### 2.8 Category inference (our inference, not a sourced fact)

Table stakes for a social activity tracker: reliable GPS record-to-save with offline queueing and auto-pause; an activity detail page with map, splits and a social layer (kudos, comments, follow); device and file import (FIT, GPX, TCX, Apple Health, Garmin) plus clear privacy tiers and start-end masking.

Differentiators: a community dataset (segments, heatmaps, suggested routes) that compounds with users; safety and live features (Beacon, live segments, off-route alerts); coaching and AI insight tied to training load. Note that Strava's policy forbids third parties from doing the last one on Strava data.

## 3. Hevy

### 3.1 Identity and positioning

| Item | Finding | Source | Status |
| --- | --- | --- | --- |
| Publisher | Hevy Studios S.L., Spain | HV-25, HV-26 | VERIFIED |
| Platforms | iOS, Android, Apple Watch, Wear OS 3+, web app at hevy.com | HV-1, HV-17, HV-23 | VERIFIED |
| Scale claim | "11M+ users" on the About page. Store text has carried 9M+ and 10M+ at different times. Marketing, unaudited | HV-2, HV-26 | VERIFIED as claim |
| Positioning (paraphrased) | A free, ad-free gym logger and planner built around fast set entry, reusable routines and progress charts, with a built-in social feed, sold on platform breadth and a low-priced Pro tier | HV-1, HV-3 | VERIFIED |
| Adjacent product | Hevy Coach, a trainer platform that delivers programs into the consumer app | HV-31 | SECONDARY |

### 3.2 Pricing and gating

US App Store snapshot from 2026-04-15 (HV-27, SECONDARY, monthly figure also on Hevy's own routines page HV-3): Hevy Pro monthly $2.99, yearly $23.99, lifetime $74.99. A second monthly SKU at $3.99 is listed without explanation. Older pages show $4.99 to $5.99 per month and $39.99 per year, likely outdated or regional (HV-29, HV-32). Subscriptions auto-renew unless cancelled 24 hours before period end (HV-33). The store listing states a 14-day withdrawal right (HV-26).

| Capability | Free | Pro | Source | Status |
| --- | --- | --- | --- | --- |
| Workout logging | Unlimited | Unlimited | HV-6 | VERIFIED |
| Saved routines | 4 | Unlimited | HV-6, HV-3 | VERIFIED |
| Custom exercises | 7 | Unlimited | HV-6, HV-12 | VERIFIED |
| Chart and data history | 3 months | All time | HV-6, HV-3 | VERIFIED |
| Statistics ranges | 30 days, 3 months | Adds 1 year and all time | HV-3 | VERIFIED |
| Muscle distribution, monthly report | Yes | Yes | HV-6 | VERIFIED |
| Set count per muscle group | No | Yes | HV-6 | VERIFIED |
| Warm-up calculator | No | Yes | HV-6, HV-15 | VERIFIED |
| Hevy Trainer (algorithmic program generator) | No | Yes | HV-5, HV-6 | VERIFIED |
| Body measurements | Weight, waist | Adds body fat and more circumferences | HV-8 | VERIFIED |
| Public API and webhooks | No | Yes | HV-18, HV-19 | VERIFIED |
| Plate calculator, supersets, RPE, watch apps, Strava sync | Free | - | HV-32 | SECONDARY gating |
| Routine folders | ? | ? | - | UNVERIFIED gating |

### 3.3 Screen inventory

No store screenshots could be viewed from this sandbox. "Help doc" means the screen is described in Hevy's own help center or feature pages.

| ID | Screen | How you get there | Purpose | Key components | States seen | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| HV-S01 | Sign-up / login | Launch, hevy.com/signup | Create account | Email and password, Google, Apple sign-in | - | Help doc (HV-16, HV-33) |
| HV-S02 | Onboarding questionnaire | After sign-up | Unknown | Trainer has its own goal and equipment questions. General onboarding unknown | - | Partial (HV-5), UNVERIFIED |
| HV-S03 | Home feed | Home tab | Feed of followed users | Workout posts, like, comment, reply, suggested-athletes carousel | Empty state UNVERIFIED | Help doc (HV-11) |
| HV-S04 | Discover | Home header menu | Popular shared workouts from strangers | Cannot be hidden | - | Help doc (HV-11) |
| HV-S05 | Workout tab | Tab bar | Start or plan training | Start Empty Workout, routines list, folders, Explore library, Trainer entry | - | Help doc (HV-10, HV-14, HV-5) |
| HV-S06 | Explore library | Workout tab | Prebuilt routines and programs | Saving a program creates a folder of routines | - | Help doc (HV-10) |
| HV-S07 | Active workout logger | Empty, routine, or copy | Log sets | Exercise cards, set rows with a PREVIOUS column (tap to copy), weight, reps, optional RPE, set type by tapping the set number (warm-up, drop, failure, normal), per-exercise rest timer, supersets with auto-scroll, exercise notes, plate calculator above the keyboard | In-progress workout persisted on device | Help doc (HV-14, HV-9, HV-15, HV-3). Replace-exercise keeps sets, superset and timer: SECONDARY (HV-28) |
| HV-S08 | Save / finish | Finish | Review and publish | Visibility with a Private option, Apple Health sync toggle, prompt to update the routine if it changed, share to Instagram, Facebook, X or copy link, heart-rate graph and calories when watch-logged | - | Help doc (HV-17, HV-11, HV-14, HV-3). "Send to ChatGPT and Claude" in v3.1.14: SECONDARY (HV-28). Description and photo fields UNVERIFIED |
| HV-S09 | Exercise picker | Logger, routine builder, Profile | Find an exercise | Search, equipment and muscle filters, recents first, then custom, create custom | - | Help doc (HV-12, HV-3) |
| HV-S10 | Exercise detail | Tap an exercise | History and records | Demo animation and written steps, chart (3 months, 1 year, all), records (heaviest weight, 1RM, best set and session volume, most reps for bodyweight, best time for duration), workout-by-workout history | - | Help doc (HV-12, HV-3) |
| HV-S11 | Custom exercise editor | Picker | Own exercises | Title, media (photo, video, GIF), equipment, primary and secondary muscles, type (fixed after creation), duplicate a library exercise | - | Help doc (HV-12) |
| HV-S12 | Routine builder | Workout tab | Templates | Exercises, sets, rep ranges, rest timers, notes, supersets, folder prompt on save | - | Help doc (HV-10, HV-14, HV-19) |
| HV-S13 | Routine folders | Workout tab | Organize | Create, drag and drop, share a folder by link or image | - | Help doc (HV-10, HV-3) |
| HV-S14 | Profile | Tab | Hub | Calendar and streak, Statistics, Measures, Exercises, settings | - | Help doc (HV-13, HV-8, HV-12) |
| HV-S15 | Calendar | Profile | History | Workout days highlighted, tap a past date to log for that date | - | Help doc (HV-13) |
| HV-S16 | Statistics | Profile | Analytics | Sets per muscle group, muscle distribution with body diagram, workouts, duration and volume totals, monthly report, year in review | - | Help doc (HV-13, HV-3) |
| HV-S17 | Measures | Profile | Body data | Weight, body fat, circumferences, progress photos (one per day, private, camera overlay) | - | Help doc (HV-8) |
| HV-S18 | Settings | Profile | Preferences | Units (weight, distance, body), default rest timer, warm-up sets toggle that recalculates PRs, warm-up calculator, plate calculator with custom bar and plates, smart superset scrolling, RPE tracking, previous-values source, sounds, privacy and social, export and import, integrations | - | Help doc (HV-15, HV-11, HV-7, HV-17) |
| HV-S19 | Export and import | Settings | Portability | Export workouts or measurements, import a Strong CSV (English, once, revertible) | - | Help doc (HV-7) |
| HV-S20 | User profile / follow | Feed, search | Social | Follow or request (private profiles), likes, comments | - | Help doc (HV-11) |
| HV-S21 | Apple Watch app | watchOS | Phone-free logging | Full workout tracking, routine sync, heart rate | - | Site and help (HV-1, HV-17) |
| HV-S22 | Wear OS app | Wear OS 3+ | Same | Live sync, tile, heart rate | - | Help doc (HV-17), SECONDARY (HV-28) |
| HV-S23 | Web app | Browser | Account and developer settings | Settings, Developer: API key and webhook | - | HV-18, HV-23, HV-24. Logging scope UNVERIFIED |
| HV-S24 | Hevy Trainer | Workout tab | Generated program | Questions, then a program with exercises, rep ranges, rest and start weights, adjustable equipment, focus, duration, goal and frequency, swap exercise, progress report | - | Help doc (HV-5, HV-4) |
| HV-S25 | Hevy Coach | hevycoach.com and coach apps | Trainer platform | Program builder, client management | - | SECONDARY (HV-31) |

### 3.4 User flows

| ID | Flow | Screens | Happy-path taps | Edge cases |
| --- | --- | --- | --- | --- |
| HV-F01 | Log a workout from a routine | S05, S07, S08, S03 | About 3 to start, then per set, about 2 to finish | App killed: the unsaved workout is stored on device and resumable, lost on uninstall (HV-16). Offline behavior UNVERIFIED. Routine edited mid-session prompts an update (HV-3). Rest timer does not auto-start before a drop set (HV-9) |
| HV-F02 | Create a routine | S05, S12, S09, S12, S13 | About 6 plus | Free cap of 4 routines (HV-6). Folder prompt only when more than one folder exists (HV-10) |
| HV-F03 | Add a custom exercise | S09 or S14, S11 | 5 to 7 fields | Free cap of 7 (HV-12). Type immutable after creation (HV-12) |
| HV-F04 | Replace an exercise mid-workout | S07, S09, S07 | UNVERIFIED | Sets, superset and timer carry over (HV-28, SECONDARY) |
| HV-F05 | Review an exercise chart | S14, S09, S10 | 3 | Free shows a 3-month window (HV-6) |
| HV-F06 | Export data | S14, S18, S19 | 4 | Workouts and measurements export separately (HV-7). Column schema UNVERIFIED |
| HV-F07 | Follow and like | S03, S20, S03 | About 3 | Private profiles require approval. Per-workout Private visibility (HV-11) |
| HV-F08 | Get an API key or webhook | S23 | Settings, Developer, generate | Pro only (HV-18). Key shown once (HV-24, SECONDARY). Webhook URL plus auth header (HV-23) |
| HV-F09 | Switch units | S18 or the logger menu | 2 to 3 | Global units plus per-exercise override. Disabling warm-up sets recalculates volume and PRs (HV-15) |

### 3.5 Feature list

| Feature | Area | Free or Pro | Source | Status |
| --- | --- | --- | --- | --- |
| Empty workout, from routine, copy a past workout | Logging | Free | HV-14 | VERIFIED |
| PREVIOUS column with tap-to-fill and selectable source | Logging | Free | HV-14, HV-3 | VERIFIED |
| Set types: normal, warm-up, drop, failure | Logging | Free | HV-9, HV-19 | VERIFIED |
| RPE column toggle | Logging | Free per HV-32 | HV-15 | VERIFIED feature, SECONDARY gating |
| Supersets with smart scrolling | Logging | Free per HV-32 | HV-3 | VERIFIED feature, SECONDARY gating |
| Rest timer per exercise, default timer, sounds | Logging | Free | HV-15 | VERIFIED |
| Plate calculator with custom bar and plates | Logging | Free per HV-32 | HV-15, HV-3 | VERIFIED feature, SECONDARY gating |
| Warm-up calculator | Logging | Pro | HV-6, HV-15 | VERIFIED |
| Replace exercise keeps sets | Logging | - | HV-28 | SECONDARY |
| Routines with rep ranges, notes, rest | Routines | 4 free, unlimited Pro | HV-6, HV-10, HV-19 | VERIFIED |
| Folders with drag and drop and folder sharing | Routines | Gating UNVERIFIED | HV-10, HV-3 | VERIFIED feature |
| Explore routine and program library | Routines | Free | HV-10 | VERIFIED |
| Hevy Trainer algorithmic program generator | Routines | Pro | HV-5, HV-4 | VERIFIED |
| 400+ exercise library with animations and instructions | Library | Free | HV-12, HV-3 | VERIFIED |
| Search with muscle and equipment filters | Library | Free | HV-12, HV-3 | VERIFIED |
| Custom exercises with media | Library | 7 free, unlimited Pro | HV-12 | VERIFIED |
| Per-exercise charts, records, 1RM | Progress | 3-month window free | HV-12, HV-6 | VERIFIED |
| Calendar and streaks | Progress | Free | HV-13 | VERIFIED |
| Muscle distribution and monthly report | Progress | Free | HV-6, HV-13 | VERIFIED |
| Sets per muscle group, year and all-time ranges | Progress | Pro | HV-6, HV-3 | VERIFIED |
| Weight, body fat, circumferences, photos | Measurements | Partly free | HV-8 | VERIFIED |
| Feed, follow, like, comment, Discover | Social | Free | HV-11 | VERIFIED |
| Private profile and per-workout privacy | Social | Free | HV-11 | VERIFIED |
| Share workout link or image | Social | Free | HV-14 | VERIFIED |
| Apple Health, Health Connect, Strava (full-detail sync since June 2026) | Integrations | Free per HV-32 | HV-17, HV-4 | VERIFIED |
| Garmin | Integrations | Not available, API access denied by Garmin | HV-17 | VERIFIED |
| Apple Watch and Wear OS apps | Integrations | Free | HV-1, HV-17 | VERIFIED |
| Public REST API and webhook | Integrations | Pro | HV-18, HV-19, HV-23 | VERIFIED, webhook SECONDARY |
| Units global and per exercise | Settings | Free | HV-15 | VERIFIED |
| CSV export (workouts, measurements), Strong CSV import | Settings | Free | HV-7 | VERIFIED |
| Send a workout to ChatGPT or Claude from the finish screen | Integrations | ? | HV-28 | SECONDARY |

### 3.6 Public review themes (opinions, not facts)

Ratings are aggregator snapshots (SECONDARY, HV-27): App Store 4.9 from about 60.8K ratings (2026-03-12), Google Play 4.9 from about 201.6K reviews and about 5.0M installs (2026-03-11). Direct App Store review text could not be fetched from this sandbox.

Praises: generous free tier, fast clean logging, watch apps, progress graphs, active development and community (HV-29, HV-30, HV-32).
- "free version has everything most people need, and the Apple Watch connection makes life so much easier" (Reddit via GummySearch, HV-30, undated).
- A forum poster switched because a competitor was "randomly deleting workouts" and Hevy "seems to be where most Strong exiles go" (MacPowerUsers, HV-30, undated).
- Garage Gym Reviews (score 3.8) credits the intuitive interface, free tier, customization, social, and graphs (HV-29).

Complaints: free caps on routines and 3-month history, watch and sync data mismatches (r/Hevy "Sync" 13 posts, "Bug" 9 posts per HV-30), routine organization with no subfolders, a Discover feed that cannot be removed (HV-11), and no coaching.
- "Feature request - Ability to add subfolders and ave HR saved in the workout" (r/Hevy via mirror, HV-30, about September 2026).
- "reports that the free version is limited" (Garage Gym Reviews, HV-29, undated).
- "it logs what you did, it shows you your progress, but it doesn't coach" (ICON review, 3.2 of 5, HV-29, 2026).

### 3.7 What a new app cannot replicate

- The social graph and Discover feed (HV-2, HV-11).
- The 400+ curated exercise animations and instructions. They are Hevy's licensed content and the Terms forbid redistribution (HV-12, HV-25).
- Hevy Coach trainer-to-client relationships (HV-31).
- The prebuilt program library and a Trainer algorithm tuned on their data (HV-10, HV-5).
- Store reputation, with 4.9 ratings and large review counts (HV-27).
- Watch-app maturity and years of Health and Strava integration work (HV-17, HV-4).

### 3.8 Inferred data model

From the official OpenAPI document (HV-19). Confidence high unless noted.

| Entity | Key fields |
| --- | --- |
| User | id, name, url |
| Workout | id, title, routine_id, description, start_time, end_time, created_at, updated_at, exercises[] |
| WorkoutExercise | index, title, notes, exercise_template_id, supersets_id, sets[] |
| Set | index, type in {normal, warmup, dropset, failure}, weight_kg, reps, distance_meters, duration_seconds, rpe, custom_metric |
| Routine | id, title, folder_id, created_at, updated_at, exercises[] with rest_seconds, sets carry rep_range {start, end} |
| RoutineFolder | id, index, title, created_at, updated_at |
| ExerciseTemplate | id, title, type (weight_reps, reps_only, bodyweight_reps, bodyweight_assisted_reps, duration, weight_duration, distance_duration, short_distance_weight), primary_muscle_group, secondary_muscle_groups[], is_custom, equipment_category on create |
| ExerciseHistoryEntry | workout_id, workout_title, workout start and end, exercise_template_id, weight_kg, reps, distance_meters, duration_seconds, rpe, custom_metric, set_type |
| BodyMeasurement | date, weight_kg, lean_mass_kg, fat_percent, neck, shoulder, chest, bicep, forearm, abdomen, waist, hips, thigh, calf (left and right, cm) |
| WorkoutEvent | type in {updated, deleted}, workout or id plus deleted_at |
| WebhookSubscription | url, authToken (SECONDARY, HV-22, HV-23) |
| Follow, Like, Comment with reply, WorkoutVisibility, ProgressPhoto | Not in the API. Inferred from help docs (HV-11, HV-8). Medium confidence |

### 3.9 Category inference (our inference, not a sourced fact)

Table stakes for a strength logger: sub-second set entry with previous values, set types and a rest timer; routines with supersets, notes and folders; per-exercise history, PR and 1RM charts, and CSV export.

Differentiators: a community feed and sharing, platform breadth (watch apps, web, public API and webhooks, Health and Strava sync), and a cheap lifetime price on top of a generous free tier, now with algorithmic programming.

## 4. The Standard by CBUM (store name: STNDRD)

### 4.1 Identity

The app the brief calls "The Standard" is listed as **STNDRD Workout & Fitness Plans** (earlier "STNDRD: Bodybuilding Workouts", originally "Cbum Fitness"). "The Standard" is the name of Bumstead's newsletter and Skool community. Identity was confirmed three ways: the listing text names Chris Bumstead as coach, the Android package is `uni.cbum`, and the old `cbum-fitness` App Store slug resolves to the same app id. An unrelated "STNDRD Collective" app exists and was excluded.

| Item | Finding | Source | Status |
| --- | --- | --- | --- |
| Developer | Set The Standard LLC | TS-1, TS-3, TS-5 | VERIFIED |
| Identifiers | iOS app id 1573298047, Android package `uni.cbum` | TS-1, TS-5 | VERIFIED |
| Official domains | stndrd.app plus checkout, shop, plus, join subdomains | TS-5 to TS-8 | VERIFIED |
| Launch | About Nov 2021 as Cbum Fitness | TS-22, TS-23 | SECONDARY |
| Rebrand to STNDRD | Mid-September 2024, with Justin King introduced as a second coach | TS-13, TS-18 | SECONDARY (dates decoded from social post ids) |
| Platforms | iOS and Android 8.0+. iPad and watch support not found. A web login page exists, scope unknown | TS-1, TS-5, TS-23 | VERIFIED / UNVERIFIED for web scope |
| Current version | 4.1.61 (2026-10-05), frequent 4.1.x releases through 2026 | TS-1, TS-23 | VERIFIED |
| Positioning (paraphrased) | Coached bodybuilding and strength programs based on Bumstead's prep methods and King's progressive-overload programming, explicitly not AI-generated, with "simple" nutrition tracking that supports training rather than replacing a diet app. Marketing claims 150,000+ members, unaudited | TS-1, TS-5, TS-7 | VERIFIED as claims |
| Target user | Intermediate gym-goers and bodybuilding fans who want a celebrity coach's structure. Terms state programs are generic and based on sign-up goals | TS-7, TS-9 | VERIFIED |

### 4.2 Pricing and gating

| Item | Finding | Source | Status |
| --- | --- | --- | --- |
| Model | Free download, subscription, 7-day trial. One teardown captured a no-trial soft paywall at a different time | TS-1, TS-7, TS-15 | VERIFIED, trial availability varies |
| Site prices | $19.99 per month, $79.99 per year shown struck from $119.99 | TS-7 | VERIFIED on 2026-10-11 |
| App Store IAP list | Monthly $14.99 and $19.99, yearly $79.99 and $119.99, a "STNDRD6: Amplify" one-off at $24.99. Older snapshots show other tiers | TS-1, TS-4 | VERIFIED, snapshots conflict, re-check live |
| STNDRD+ tier | Weekly live calls, Q&A, curriculum, private chat with coach access. Labeled "coming soon" on the comparison page. Price unknown | TS-8, TS-1 | VERIFIED as offer, price UNVERIFIED |
| What is gated | Programs, logging and nutrition all sit behind membership. Reviewers complain they must pay before seeing content | TS-7, TS-8, TS-2 | VERIFIED |
| Refunds | No refunds, all sales final, access is 1 or 12 months from payment | TS-9 | VERIFIED |
| Adjacent products | Skool community at $10 per month with "STNDRD AI", 1:1 coaching through an Everfit white-label app, merch | TS-10, TS-11, TS-22 | SECONDARY |

### 4.3 Screen inventory

Evidence legend for this app: L = listing text, release notes, official site or terms. T = third-party UI teardown. Store screenshots could not be viewed from this sandbox, so no row is screenshot-verified.

| ID | Screen | How you get there | Purpose | Key components | States seen | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| TS-S01 | Welcome / intro video | First launch | Brand hook | Video, CTA | - | T (TS-16) |
| TS-S02 | Onboarding questionnaire | After S01 | Capture goals and equipment | Goal capture, equipment picker, program browse with filters. Step count conflicts: 5 vs 22. Experience and days-per-week questions UNVERIFIED | - | L (TS-1, TS-9), T (TS-15, TS-16) |
| TS-S03 | Paywall | End of onboarding or "Upgrade" | Convert | Monthly/yearly toggle, trial, STNDRD+ option, cancellation status, in-app checkout | Trial, active, cancelled, expired | L (TS-1, TS-8) |
| TS-S04 | Account / login | Onboarding or reinstall | Auth | Email and password, reset | Login failures and missing reset emails reported | L (TS-5 reviews) |
| TS-S05 | Home / dashboard | Tab | Today's session and stats | Activity stats (v4.1.61), weekly calorie balance | - | L (TS-1) |
| TS-S06 | Program catalog | Workouts tab | Choose a program | Filters, previews, coach attribution, lengths 2 to 7 weeks, phases, difficulty, challenges, 35+ one-off workouts | - | L (TS-1, TS-7) |
| TS-S07 | Program detail / phase | Tap a program | Commit | Phases, week-by-week unlock | - | L (TS-1, TS-7) |
| TS-S08 | Weekly plan / day view | Inside a program | Pick today's workout | App-assigned training days, only past days selectable | - | L (TS-2), T (TS-20) |
| TS-S09 | Active workout | Start workout | Log the session | Sets, reps, weight, rest, rest timer with auto-advance, replace exercise with revert, coach videos, drop-set and rest-pause prescriptions, pause and resume | Crashes and lost input reported, timer stops in background | L (TS-1, TS-2) |
| TS-S10 | Exercise library | Tab | Browse movements | Muscle and region filters, video demos, descriptions | Videos failing to load reported | T (TS-15, TS-17), L (TS-2) |
| TS-S11 | Custom workout builder | Workouts | Build own session | Add and swap exercises | - | L (TS-1) |
| TS-S12 | Nutrition dashboard | Nutrition tab | Targets vs intake | Calorie and macro targets, weekly calorie balance | - | L (TS-1), T (TS-15) |
| TS-S13 | Nutrition goal calculator | From S12 | Set targets | Weight, height, age, activity inputs, goal types Custom / Fat loss / Bulking | - | T (TS-15) |
| TS-S14 | Food log, search, barcode | From S12 | Log meals | Barcode scanner (v4.1.38), "10M+ foods" claim. Custom foods and recipes UNVERIFIED | - | L (TS-1, TS-7) |
| TS-S15 | Progress | Tab or profile | Track body and lifts | Weight charts (v4.1.54), lift history. Measurements and photos SECONDARY | History-loss complaints | L (TS-1, TS-2) |
| TS-S16 | Community feed and chat | Tab | Share and support | Posts with optional image, chat | - | L (TS-1, TS-7) |
| TS-S17 | Leaderboard | From community | Gamification | Global leaderboard, XP per completed workout | - | L (TS-7, TS-1) |
| TS-S18 | Articles | Tab | Education | Nutrition and training articles | - | T (TS-15), L (TS-7) |
| TS-S19 | Challenges | Catalog or community | Time-boxed programs | Six-week challenges, some sold as one-off IAP | - | L (TS-1, TS-7) |
| TS-S20 | Profile / settings | Tab | Manage account | Subscription management, data deletion request | - | L (TS-1, TS-6) |
| TS-S21 | STNDRD+ hub | Members | Group coaching | Live calls, Q&A, curriculum, private chat | "Coming soon" | L (TS-8), partly UNVERIFIED |

### 4.4 User flows

| ID | Flow | Screens | Edge cases seen |
| --- | --- | --- | --- |
| TS-F01 | Onboard and pick a program | S01, S02, S04, S03, S06, S07 | Paywall gates all content. Reinstall can show an active subscription but locked content (review) |
| TS-F02 | Complete today's workout | S05 or S08, S09, summary and XP, S17 | Timer halts when backgrounded. Crash loses inputs. Switching to a music app reset a session (reviews) |
| TS-F03 | Swap an exercise | S09, replace, revert if needed | Replacement video not viewable before choosing. Weak alternatives (reviews) |
| TS-F04 | Set targets and log a meal | S12, S13, S14, back to S12 | Food database provider undisclosed |
| TS-F05 | Progress check-in | S15, S05, community post | No formal in-app coach check-in found. 1:1 coaching runs in a separate app (SECONDARY) |
| TS-F06 | Join a challenge | S19, enroll, community, leaderboard | Some challenges are one-off purchases |
| TS-F07 | Cancel subscription | S20 to the store subscription page | No refunds. Android reviews report charges while unable to cancel or log in |

### 4.5 Feature list

| Feature | Area | Free or paid | Source | Status |
| --- | --- | --- | --- | --- |
| Coach-authored multi-week programs with phases (Olympia prep logs, PPL, bro split, powerbuilding hybrid, King's strength and hypertrophy) | Programs | Paid | TS-1, TS-7, TS-18 | VERIFIED |
| 35+ one-off workouts, limited-equipment sessions | Programs | Paid | TS-7 | VERIFIED |
| Challenges with community and leaderboard | Programs, community | Base plan, some IAP | TS-1, TS-7, TS-8 | VERIFIED |
| Week-by-week unlocking | Programs | Paid | TS-1 | VERIFIED |
| Set, rep, weight, rest logging with auto-advance rest timer, pause and resume | Logging | Paid | TS-1 | VERIFIED |
| Exercise replace and revert, equipment-aware substitution | Logging | Paid | TS-1 | VERIFIED |
| Coach-performed demo videos and written cues | Content | Paid | TS-1, TS-18 | VERIFIED, reliability complaints |
| Custom workouts | Logging | Paid | TS-1 | VERIFIED |
| Drop-set and rest-pause prescriptions | Programs | Paid | TS-1 | VERIFIED |
| Macro and calorie targets from a goal calculator | Nutrition | Paid | TS-15 | SECONDARY |
| Meal logging, barcode scan, "10M+ foods" | Nutrition | Paid | TS-1, TS-7 | VERIFIED as claim, provider UNVERIFIED |
| Weekly calorie balance | Nutrition | Paid | TS-1 | VERIFIED |
| Recipes or meal plans | Nutrition | - | None | UNVERIFIED, no evidence |
| Weight charts, dashboard stats | Progress | Paid | TS-1 | VERIFIED |
| Measurements, progress photos | Progress | - | TS-17, TS-19 | SECONDARY |
| Community feed, chat, XP leaderboard | Community | Paid | TS-1, TS-7 | VERIFIED |
| Articles library | Content | Paid | TS-15, TS-7 | SECONDARY |
| Group coaching calls (STNDRD+) | Coaching | Separate tier | TS-8 | VERIFIED as offer, availability UNVERIFIED |
| 1:1 coaching | Coaching | Separate product | TS-10, TS-11, TS-22 | SECONDARY |
| In-app check-in forms or coach messaging | Coaching | - | None | UNVERIFIED, no evidence |
| Apple Health, Health Connect, watch, MyFitnessPal | Integrations | - | None found | UNVERIFIED, likely absent |
| Public API | Integrations | - | None on site, stores or terms | VERIFIED absent |

### 4.6 Public review themes (opinions, not facts)

Ratings on 2026-10-11: App Store US 4.6 stars from about 3.8K ratings (TS-1). Google Play 3.2 to 3.3 stars from about 1.0 to 1.1K reviews, 50K+ installs (TS-5). The platform gap is itself a signal: Android reviews skew to login and billing failures.

Praises:
1. Program quality and structure. App Store: "effective for people who want routine and structure" (TS-2, 2024 to 2025). A press reviewer reported PRs within six weeks (TS-18, March 2025).
2. Integrated meal tracking. Play: "great app for tracking meals and great workouts" (TS-5).
3. Improved after the rebrand. Play: "there were a few bugs along the way" then "outstanding workout app" (TS-5).
4. Customizable sessions. Play: "you can customize them to your liking" (TS-5).
5. Support eventually resolves access issues and the developer replies publicly (TS-2, TS-5).

Complaints:
1. Crashes and lost logs. "at least once a workout the app would crash, and I would have to resume the workout" and "all of my inputs for a workout" lost (TS-2, 2023 to 2025).
2. Rest timer stops in the background. "when you click out of the app, the rest timer stops until you open the app back up" (TS-2).
3. Billing, cancellation and login. "they have been charging me every month and I am not able to cancel my subscription" (TS-5). Reset emails that never arrive. Stuck on the logo screen for a week (TS-5).
4. Paywall and value. "I wasn't able to use the basic functions of the app without being greeted with the dreaded subscription service" and "for $120 a year you'd expect something a bit more polished" (TS-2).
5. Program rigidity. The app assigns training days and users cannot set their own schedule (TS-20). Demo videos "work maybe 20% of the time" (TS-2).

### 4.7 What a new app cannot replicate

- The Bumstead brand, six Olympia titles, and social distribution that makes six-figure membership claims possible without paid acquisition (TS-1, TS-21).
- Coach-authored program IP, including actual prep logs, and King's programming (TS-7, TS-13).
- The coach-performed video library (TS-18).
- An existing community, leaderboard population, newsletter audience, and weekly live calls (TS-7, TS-11, TS-12).

### 4.8 Inferred data model

| Entity | Key fields | Evidence | Confidence |
| --- | --- | --- | --- |
| User | profile (weight, height, age, activity), goal, equipment, subscription tier and status, XP | TS-1, TS-9, TS-15 | High |
| Coach | name, bio, programs | TS-1, TS-7 | High |
| Program | coach, length in weeks, phases, difficulty, location, type (program, challenge, one-off), unlock schedule | TS-1, TS-7 | High |
| ProgramPhase, ProgramWeek, ProgramDay | assigned weekday, workout template | TS-1, TS-20 | Medium, day assignment inferred from complaints |
| WorkoutTemplate, WorkoutExercise | order, prescribed sets, reps, rest, technique (drop set, rest-pause), video | TS-1 | High |
| Exercise | name, muscle group, video, description, alternates | TS-15, TS-1 | High |
| WorkoutSession | start, pause, resume, complete, program day reference | TS-1 | High |
| SetLog | reps, weight, rest, completed | TS-1 | High |
| ExerciseSwap | original, replacement, revertible | TS-1 | High |
| NutritionGoal | goal type, calories, protein, carbs, fat | TS-15 | Medium |
| Food, FoodLog | barcode, nutrients, date, meal, servings | TS-1, TS-7 | Medium |
| WeightEntry | date, weight | TS-1 | High |
| Measurement, ProgressPhoto | - | TS-17, TS-19 | Low, guess |
| CommunityPost, Comment, ChatMessage | optional image | TS-1 | Medium |
| LeaderboardEntry | XP, rank, period | TS-7 | Medium |
| Challenge | dates, enrollment, IAP | TS-1, TS-7 | Medium |
| Article | category, body | TS-15 | Medium |
| Subscription | plan, trial, cancellation status, store | TS-1, TS-8 | High |
| CheckIn | - | No evidence | Guess: absent |

### 4.9 Category inference (our inference, not a sourced fact)

Table stakes for a structured-program-plus-nutrition app: multi-week coach-authored programs with phase progression and a day view, friction-free set logging with a rest timer, demo videos with equipment-aware substitutions, and macro targets from a calculator plus food logging with barcode support, under a trial with monthly and annual plans.

Gaps STNDRD leaves open: user-chosen training days with reschedule and skip that do not break the program, reliability basics (background rest timer with notification, crash-safe local session persistence, offline logging), and transparent billing with a clear cancel path and no pay-to-peek.

## 5. Official API and terms constraints

This is the section that most constrains the architecture in step 2. Everything here was read from search-engine excerpts of the official pages, not from full-page reads, because the sandbox network policy denied the hosts. The Strava API Agreement and API Policy in particular must be read in full before the Strava integration design is approved. Nothing in this section is legal advice.

### 5.1 Strava API

Summary for Revive X: Strava's API is open to use through OAuth, but the 2024 to 2026 policy changes make "pull Strava into our app" a poor foundation and "push Revive X activities to Strava" the safe pattern. A third-party app may show a user's Strava data only to that user, may cache it for at most 7 days, may not feed it to any AI application, may not build something that competes with or replicates Strava, and the developer must now hold a Strava subscription.

Portal and registration:

| Item | Finding | Source | Status |
| --- | --- | --- | --- |
| Portal | developers.strava.com. Apps are created from the API settings page while logged in, with name, category, website and an authorization-callback domain. `localhost` is allowed in development | SV-19 | VERIFIED |
| Developer subscription | Since 2026-06-01 for new apps and 2026-06-30 for existing ones, a Strava subscription is required for Standard-tier developers. Extended Access is exempt. No API fee beyond the subscription | SV-30, SV-40 | VERIFIED, fee statement SECONDARY |
| Athlete cap | New apps start in single-player mode (owner only). Since June 2026 developers can self-upgrade to 10 athletes from the dashboard. Beyond 10 requires submitting the app for review, during which no extra athletes can authorize. Staff cited 7 to 10 business days, developers report longer waits | SV-19, SV-21, SV-30, SV-31 | VERIFIED, wait times community reports |
| Tiers above review | Reviewed Standard up to 9,999 athletes, Extended Access from about 10,000 with higher limits, Partner APIs and priority support | SV-30, SV-40 | SECONDARY |

OAuth 2.0:

| Item | Finding | Source | Status |
| --- | --- | --- | --- |
| Endpoints | Authorize at `https://www.strava.com/oauth/authorize` or `/oauth/mobile/authorize`. Token exchange and refresh at `POST https://www.strava.com/oauth/token` | SV-20, SV-26 | VERIFIED |
| Scopes | `read`, `read_all`, `profile:read_all`, `profile:write`, `activity:read`, `activity:read_all`, `activity:write`. Users may decline individual scopes, so the returned `scope` must be checked | SV-20, SV-25 | VERIFIED |
| Token lifetime | Access tokens expire 6 hours after issue. Refreshing returns a new refresh token and invalidates the old one. If more than 1 hour remains, the same access token is returned | SV-20 | VERIFIED |
| Revocation | `POST /oauth/revoke` available from 2026-06-01 and the only supported method from 2027-06-01. Revoking one token type revokes the other | SV-25 | VERIFIED |
| Base URL change | Moves to `https://api-v3.strava.com`, available from 2027-01-04 | SV-25 | VERIFIED |

Rate limits:

| Item | Finding | Source | Status |
| --- | --- | --- | --- |
| Default | Overall 200 requests per 15 minutes and 2,000 per day. Read (non-upload) 100 per 15 minutes and 1,000 per day. Windows reset at :00, :15, :30, :45 and midnight UTC. Headers `X-RateLimit-Limit`, `X-RateLimit-Usage`, `X-ReadRateLimit-Limit`, `X-ReadRateLimit-Usage`. HTTP 429 when exceeded | SV-21 | VERIFIED |
| Self-upgrade tier | 10 athletes, read 200 per 15 minutes and 2,000 per day, overall 400 and 4,000 | SV-19 | VERIFIED |
| Raises | Strava raises limits only for apps near capacity and says apps with fewer than 100 users are probably inefficient if they hit limits | SV-21 | VERIFIED |

Webhooks: one subscription per app, a GET validation handshake, events for activity `create`, `update` and `delete`, plus athlete `update` with `authorized: false` on deauthorization. Update payload keys are `title`, `type` and `private` (privacy changes need `activity:read_all`). The endpoint must return 200 within 2 seconds. Up to 3 delivery attempts (SV-22). VERIFIED.

Upload and write: `POST /uploads` (multipart) accepts fit, fit.gz, tcx, tcx.gz, gpx and gpx.gz and needs `activity:write`. Processing is asynchronous, so poll the upload status until an `activity_id` appears. Duplicates are detected at processing time with an error naming the existing activity (SV-23). From 2026-05-21 FIT set messages (exercise, reps, weight, duration) are ingested, which is how strength workouts with sets reach Strava (SV-25). Manual activities use `POST /activities` with required `name`, `sport_type`, `start_date_local` and `elapsed_time`, optional `description`, `distance`, `trainer` and `commute`, returning a DetailedActivity (SV-24). VERIFIED.

Agreement and policy restrictions:

| Topic | Clause (close paraphrase) | Source | Status |
| --- | --- | --- | --- |
| Display to other users | Since 2024-11-11 a third-party app may show a user's Strava activity data only to that user. Public feeds and heatmaps are named as examples of what is no longer allowed. Agreement text: sharing a user's data with other users or third parties requires explicit consent, and data about other users may not be displayed even if public on Strava. Section number not captured | SV-27, SV-29 | VERIFIED |
| AI and machine learning | Policy section 5.3: no use of API materials or Strava data in connection with the development, training, evaluation or operation of any AI application, including derived, aggregated or anonymized data, grounding, embeddings, retrieval, or "ingestion into a context window". Carve-out for Strava's own MCP connector (section 3.5). The FAQ says apps exposing athlete data to third-party AI tools will not be approved. Inference-only use is an open question on the developer forum | SV-28, SV-30, SV-31 | VERIFIED, forum interpretation informal |
| Replication and competition | Agreement: apps may not compete with or replicate Strava functionality. Policy: no app that imitates Strava's look, imagery or brand identity, and no use competitive to Strava. The developer site reserves token revocation for virtual races or competitions and for replicating Strava services | SV-19, SV-27, SV-28, SV-29 | VERIFIED, section numbers not captured |
| Commercial use | Section 5.8: no charging end users for access to API materials; charging only for functionality not provided by, or substantially duplicative of, Strava. Section 5.9: no Strava data in ads or targeting without written consent. Section 5.10: no selling or licensing data to third parties even with user consent | SV-28 | VERIFIED |
| Retention and deletion | Section 6.2: cache at most 7 days. Section 6.3: reflect user deletions within 48 hours. Section 6.4: retain only as needed. Section 7.4: delete within 30 days of revocation. On termination delete all API materials and certify in writing. A staff reply on the forum said there is no owner-display exception to the 7-day cache rule | SV-27, SV-28, SV-31 | VERIFIED, forum reply informal |
| Intermediaries | Routing Strava data through third-party intermediary platforms is no longer supported from June 2026. Direct integrations are unaffected | SV-30 | VERIFIED |
| Segments and leaderboards | Leaderboard endpoint removed in 2020. Rank fields are subscriber-only. From 2026-09-01 Explore Segments is restricted to Extended Access, and club activities, members and admins endpoints were removed | SV-25 | VERIFIED |
| Brand | Use "Powered by Strava" or "Compatible with Strava" when referring to interoperability. Logos separate from and not more prominent than yours, no modification or animation, no "Strava" in the app name or implied endorsement. A "Connect with Strava" button must link to the authorize endpoints. Whether the badge is mandatory, and whether a link-back to Strava is required, could not be confirmed | SV-26 | VERIFIED, mandatory status UNVERIFIED |

### 5.2 Hevy public API

Summary for Revive X: an official API exists and reading a user's own data with their own key is the sanctioned path. It is not an OAuth integration, it is Pro-only on Hevy's side, it has no delete endpoints, no documented rate limits, and no API-specific terms. Any Hevy import feature should be positioned as "bring your own key", treated as an early-rollout dependency that Hevy says may change or be abandoned, and never used to re-display Hevy's exercise media or library content.

| Item | Finding | Source | Status |
| --- | --- | --- | --- |
| Exists | Yes. "Hevy Public API Docs", OpenAPI 3.0, version 0.0.1, base URL https://api.hevyapp.com | HV-18, HV-19, HV-21 | VERIFIED |
| Docs | https://api.hevyapp.com/docs/ | HV-18 | VERIFIED |
| Who can get a key | Hevy Pro subscribers only, one key per account | HV-18, HV-19, HV-24 | VERIFIED, per-account SECONDARY |
| Issuance | Web app, Settings, Developer. No separate developer portal | HV-18, HV-24 | VERIFIED |
| Auth | Required `api-key` header carrying a UUID. No OAuth | HV-19, HV-20 | VERIFIED |
| Resources | Workouts, user info, routines, exercise templates, routine folders, exercise history, body measurements | HV-18, HV-19 | VERIFIED |
| Writes | Create and update for workouts, routines and measurements. Create-only for templates and folders. No DELETE anywhere | HV-19, HV-22 | VERIFIED |
| Pagination | 1-based `page` plus `pageSize`, max 10 for most resources and 100 for templates. Exercise history is unpaginated | HV-19, HV-20 | VERIFIED |
| Rate limits | None documented. Docs ask scheduled syncs to avoid the top of the hour | HV-19, HV-20 | VERIFIED as absence |
| Change feed | `/v1/workouts/events?since=` returns `updated` (full workout) and `deleted` (id, deleted_at) events, which makes incremental sync possible | HV-19 | VERIFIED |
| Webhooks | Not in the OpenAPI document. Configured beside the API key: destination URL plus auth header. Hevy POSTs a workout id on new workouts and expects a 200 within 5 seconds. Appears to be one per account | HV-22, HV-23 | SECONDARY |
| Stability | Docs describe an early rollout that may change or be abandoned, used at your own risk | HV-18, HV-19 | VERIFIED |
| API-specific terms | None found. Only the stability disclaimer. No commercial-use, storage, display, attribution or competition clauses | HV-19, HV-20 | VERIFIED as absence. Gap flagged |
| General terms | Hevy Studios S.L. Limited, non-exclusive, non-transferable license. Beyond one personal copy, no copying, modifying, republishing, transmitting or distributing app content without written permission. Clauses on scraping, reverse engineering, derivative works and automated access were not visible in the excerpts | HV-25 | VERIFIED partial, remainder UNVERIFIED |
| Export and import | CSV export of workouts and measurements from Settings. Import accepts Strong CSV only. Third-party importers describe a header with title, start and end time, exercise title, superset id, set index, set type, weight, reps, distance, duration and RPE | HV-7 | Export VERIFIED, schema UNVERIFIED |
| Other integrations | Apple Health (toggle on save, not retroactive), Health Connect, Strava full-detail sync since June 2026. Garmin denied Hevy API access | HV-17, HV-4 | VERIFIED |

What this allows and forbids for Revive X, as our reading, not legal advice:
- Allowed in practice: a user pastes their own Hevy key into Revive X, and Revive X pulls their workouts and measurements. Third-party tools already do this openly (a Google Sheets add-on, several open-source SDKs).
- Not covered by any terms: commercial use by Revive X. Ask Hevy before relying on it in a paid feature.
- Forbidden: redistributing Hevy's exercise media, instructions or library content.
- Design consequence: because keys are Pro-only, Hevy import can only ever reach Hevy Pro users. It should be a convenience, not a core path.

### 5.3 The Standard (STNDRD)

No public API, developer documentation, export or webhook was found on the site, in the stores or in the terms (TS-7, TS-9). VERIFIED as absence. The only integration surface is the user's own screen.

### 5.4 What this means for the Revive X architecture (input to step 2, not a decision)

- Strava, push first. Recording a run or workout in Revive X and posting it to Strava through `activity:write` (file upload or createActivity, with FIT set data for strength) has no retention problem, no other-user display problem, and is the integration pattern Strava has always welcomed. Hevy itself integrates with Strava this way.
- Strava, pull with care. Importing a user's Strava activities into Revive X is allowed only for display to that user, with a 7-day cache limit as the policy reads today, 48-hour deletion mirroring, and no AI processing of any kind. A permanent Revive X history built from Strava data would need a full reading of the policy and probably a conversation with Strava before it is designed. Until then, treat Strava imports as ephemeral.
- Strava, secrets and tokens. The client secret, access tokens and refresh tokens live in Supabase Edge Function secrets and a server-side table, never in `app.json` or AsyncStorage. Tokens expire every 6 hours and refresh tokens rotate, so refresh happens server-side.
- Strava, scale and cost. One athlete until the owner self-upgrades to 10, then a review for more. The owner needs a Strava subscription to keep the developer app. Budget for the API review before any public beta that includes Strava.
- Strava, no AI, no community. No LLM feature may touch Strava-sourced data. No feed, leaderboard or group challenge may show Strava-sourced data to anyone but its owner. Community features must run on activities recorded natively in Revive X.
- Hevy, bring your own key. An import that lets a Hevy Pro user paste their own key and pull workouts and measurements is the sanctioned path, and incremental sync is possible through the events feed. It reaches only Pro users, it has no API-specific terms, and Hevy says the API may change or be abandoned. Position it as a convenience import, never as a core path, and never show Hevy's media or library content.
- STNDRD, nothing to integrate. The relevant lesson is product, not API: schedule flexibility, background-safe timers, crash-safe persistence and honest billing are the open gaps.
- Privacy before sharing. Start-end masking, privacy zones and per-activity visibility are table stakes across the category. The current Revive X social schema stores route points in a world-readable table and must change before any post is written.

## 6. Where the current Revive X build sits in the category (Direction A baseline)

This section comes from reading the repository itself (not from public sources), so every row is VERIFIED against code on commit `d027491`.

### 6.1 Health of the codebase

| Check | Result (2026-10-11) |
| --- | --- |
| `npm ci` | Installs cleanly from the lockfile |
| `npx tsc --noEmit` | Clean, 0 errors |
| `npm test` (tsx, pure-logic suites) | 82 passed, 0 failed, 9 suites |
| `npx expo-doctor` | 16 of 18 checks pass; the 2 failures are the schema and React Native Directory checks, which need Expo's servers and are blocked by this sandbox's network policy. Re-run on the Mac to confirm. |
| Size | 38 Expo Router route files, ~25.7k lines of TypeScript across `app/`, `src/`, `tests/` |
| Secrets scan | No keys found in source. `app.json` ships empty strings for the Supabase URL, Supabase anon key and the RevenueCat public key. |

### 6.2 What exists today, mapped to the reference apps

| Area | Revive X today | Nearest reference pattern | Notes |
| --- | --- | --- | --- |
| Strength logging | Active workout logger, set rows, rest timer, plate calculator, last-time history, PR banner, edit completed workouts | Hevy logging loop | No set types (warm-up/drop/failure), no RPE, no supersets, no per-set notes beyond a text field |
| Routines | Create, edit, start, save workout as routine | Hevy routines | No folders, no program/week structure |
| Exercise library | 74 exercises with owner-generated illustrations, search, muscle chips, recents, custom-free (library only) | Hevy library | Custom exercises are not supported; no equipment filter data on most entries |
| Running | Manual log, foreground GPS tracking, background GPS in dev build, splits, route trace, Apple Maps polyline on iOS dev builds | Strava record + activity detail | No feed of other athletes, no routes/segments, no watch import beyond Health import |
| Hybrid | Session logger, templates, live HYROX race simulation | No direct reference app | A genuine differentiator in this set |
| Progress | Dashboard, weekly summary, PR history, per-exercise trends, body weight, streaks and milestone rings, daily rings | Hevy statistics + Strava training log | Charts are custom SVG, no exportable reports |
| Social | Supabase email/password auth, cloud profile, username claim, schema for posts/follows/likes/comments with RLS | Hevy/Strava social | Feed, posting, likes and comments are schema-only; nothing is wired in the client yet |
| Health | Apple Health and Health Connect write and import, lazily loaded | Strava/Hevy device sync | Dormant in Expo Go by design |
| Monetization | RevenueCat rails, paywall screen, nothing gated | Hevy Pro / Strava subscription | Dark launched, key not configured |
| Nutrition / programs / coaching | None | The Standard | Entire segment absent |
| Recovery / readiness | None | None of the three | Open space |

### 6.3 Gaps against the new ground rules

| Ground rule | Status | What needs to change |
| --- | --- | --- |
| Original design only | Mostly met. Illustrations are owner-generated originals, icons come from `@expo/vector-icons` (MIT/Apache/OFL sets), no custom fonts are loaded yet. | Several project notes describe screens as "Hevy-style" or "Strava-style" and Phase 40 captured a share-flow spec from Hevy screenshots. Treat those as category patterns, not layouts to reproduce. Pick an open-source font family when the shared design system is built. The app icon is an upscaled crop of a brand board and should be replaced by a designer master before store submission. |
| Official APIs only | Not applicable yet: there is no Strava or Hevy integration in the code. | Any sync must go through the official Strava API with OAuth and server-side token storage; see section 5. |
| Mobile-first Expo + TypeScript | Met. | Monorepo move to `apps/direction-a/` is a restructure, not a rewrite. |
| Row-level access rules on every table | Partly met. All five social tables enable RLS and restrict writes to the owner. | Every table is world-readable (`using (true)`), including `posts.details`, which is documented to carry run route points. Public GPS traces leak home locations. The new shared schema needs a visibility column, follower-only reads, and route-point stripping or privacy zones before any post is written. |
| No secrets in the client | Met. Only publishable keys are designed to ship, and none are committed. | Strava client secret and any provider keys must live in Supabase Edge Function secrets, never in `app.json`. |

### 6.4 Documentation drift to resolve before step 2

- Root `AGENTS.md` and `CLAUDE_HANDOFF.md` still say "do not add Supabase, subscriptions, backend login" and list phases only through Phase 6. `PROJECT_STATE.md` records that the owner retired the no-Supabase rule in Phase 39 and that subscriptions were built dark in Phase 50. The repo is at Phase 50.
- `AGENTS.md` assigns implementation to Codex and planning to Claude. This brief asks Claude to build both directions. One of the two documents has to change.
- `docs/PROJECT_HANDOFF.md` says no automated tests exist; `tests/` now holds 82 checks.

### 6.5 Recommendation: restructure Direction A, do not restart it

Restart would discard about 25,000 lines of working, typechecked, partly tested code for no architectural gain. The brief's new requirements are additive to what exists:

- The monorepo layout (`apps/direction-a/`, `apps/direction-b/`, `packages/`) is a mechanical move. Expo SDK 54 supports npm-workspace monorepos natively, and the app keeps its routes, storage keys and Expo Go compatibility.
- The design system (theme tokens, PrimaryButton, AppCard, StatCard, ScreenContainer, SectionHeader, ProgressRing), the data types, the stats utilities and the exercise library already live in `src/` with no screen dependencies, so they extract cleanly into shared packages that Direction B consumes on day one.
- The Supabase client is config-gated and the schema already has RLS. What changes is the policy design (visibility, follower-only reads, route-point stripping) and moving the schema to `db/schema.sql`.
- Strava integration is new in either case, and section 5 says it should be push-first, which touches the existing run and workout detail screens, not the architecture.

What a restart would not fix: none of the problems found are structural. They are a schema privacy gap, documentation drift, missing fonts, and a few missing logging features (set types, RPE, supersets, custom exercises) that are small additions to the existing logger.

What to settle before step 2 starts: the AGENTS.md conflicts in 6.4, whether this work proceeds on a branch with pull requests as `docs/AGENT_RULES.md` requires, and which Direction B candidate to build.

## 7. Open and unverified items

### 7.1 Method gaps to close first

- No page was read in full and no store screenshot was viewed. Allow these hosts in the environment, or re-check from an open machine: apps.apple.com, play.google.com, strava.com, support.strava.com, developers.strava.com, communityhub.strava.com, hevyapp.com, help.hevyapp.com, api.hevyapp.com, stndrd.app, reddit.com.
- Read the Strava API Agreement and API Policy in full and record exact section numbers for the other-user display clause, the compete-or-replicate clause and the 7-day cache clause before the Strava design in step 2 is approved.
- Confirm whether the "Powered by Strava" or "Compatible with Strava" badge is mandatory, and whether a link back to Strava is required.

### 7.2 Strava

- Reviewed-Standard (9,999 athletes) and Extended Access (10,000+) thresholds are SECONDARY only.
- Whether the API still exposes streams, activity zones and photos endpoints.
- Messaging and muscle-map gating. Onboarding permission prompts. Exact tap counts.
- Dates for most App Store, Play and Product Hunt quotes. The Reddit quote comes from an archive mirror.
- Current live US price. Official pages say $11.99 and $79.99 as of July 2025. One April 2026 community post says $14.99 and $94.99.
- App-side UX for duplicate uploads. Only the API behavior is confirmed.

### 7.3 Hevy

- Full Terms text: scraping, reverse-engineering, derivative-work and commercial-use clauses, and whether the app terms differ from the site terms.
- Any API-specific terms, attribution rules or commercial-use policy. None were found.
- Webhook documentation, event types beyond "new workout", retries, and the one-per-account limit.
- Exact CSV export header and date and unit formats.
- Whether routine folders, supersets, RPE and the plate calculator are formally free. Only competitor blogs say so.
- Web app logging scope, onboarding questionnaire, finish-screen fields (description, photo), Live Activity rest timer, offline behavior.
- Why two monthly IAP SKUs ($2.99 and $3.99) exist.
- Current store rating counts. Latest snapshots are March 2026 and SECONDARY. No verbatim App Store review text could be fetched.
- Whether Hevy offers an official MCP server. Hevy Coach pricing beyond third-party brackets.

### 7.4 The Standard (STNDRD)

- Store screenshots and App Store privacy labels. Onboarding question wording and step count (5 vs 22 in two teardowns).
- STNDRD+ availability and price. Whether a lifetime plan still exists. The live IAP list (snapshots conflict: $14.99 vs $19.99 monthly, $79.99 vs $119.99 yearly).
- Food database provider, custom foods, recipes or meal plans.
- Dedicated progress photos and measurements. Any in-app check-in or coach messaging.
- Any health-platform or wearable integration. None was found.
- iPad and watch support. Scope of the web login page.
- Reddit sentiment (inaccessible) and YouTube review verdicts (titles only).
- Exact launch date (November to December 2021, SECONDARY) and rebrand date (mid-September 2024, inferred from social post ids). Whether "Knife and Fox LLC" or "Dash-Fitness" were the original publishers.

### 7.5 Direction A baseline

- Two expo-doctor checks (config schema, React Native Directory metadata) could not run without Expo's servers. Re-run on the Mac.
- No device smoke test was run here. Expo Go behavior of the current build was not exercised in this pass.
- The social tables were reviewed from `docs/supabase/schema.sql`. Whether a live Supabase project exists with that schema applied is unknown.

## 8. Sources

Sources are numbered per app. Access date for every row is 2026-10-11. Unless marked "Fetched", the page was read through search-engine excerpts because the sandbox network policy denied the host.

### 8.1 Strava sources

| # | Type | Title | URL | What it gave |
| --- | --- | --- | --- | --- |
| SV-1 | Site | Strava Subscription (subscribe page) | https://www.strava.com/subscribe | US plan prices, trial, Family, Student, Runna bundle, discounts (snapshot about mid-2025) |
| SV-2 | Site | Strava pricing page | https://www.strava.com/pricing | $11.99 per month, $79.99 per year, "updated July 1, 2025" |
| SV-3 | Help | What Features Are Included in a Strava Subscription? | https://support.strava.com/en-us/articles/15402044-what-features-are-included-in-a-strava-subscription | Gated feature list, Beacon wording |
| SV-4 | Help | Segments: leaderboard filters, Live Segments, Local Legends, finding segments | https://support.strava.com/en-us/articles/15401771-segment-leaderboard-filters · https://support.strava.com/en-us/articles/15402065-how-do-live-segments-work-on-strava · https://support.strava.com/en-us/articles/15401751-what-is-the-local-legend-achievement-on-strava · https://support.strava.com/hc/en-us/articles/360061773291-Finding-Segments-on-the-Strava-App | Free top-10 vs full leaderboard, filters, Live Segments tiers, Maps-tab discovery |
| SV-5 | Help | A Guide to Strava Heatmaps | https://support.strava.com/en-us/articles/16046277-a-guide-to-strava-heatmaps | Global free, Personal, Weekly, Night subscriber-only |
| SV-6 | Help | Strava Beacon | https://support.strava.com/en-us/articles/15401829-strava-beacon | Setup flow, contacts, link page, refresh interval |
| SV-7 | Help | Recording an Activity, Auto-Pause, Apple Watch app | https://support.strava.com/hc/en-us/articles/216917397-Recording-an-Activity · https://support.strava.com/en-us/articles/15402141-auto-pause · https://support.strava.com/en-us/articles/15401820-strava-apple-watch-app | Record, pause, finish, save, discard behavior |
| SV-8 | Help | Privacy: map visibility, activity privacy controls, new-account defaults, under-18 defaults, Privacy FAQ, group activities, profile privacy, followers and blocking | https://support.strava.com/en-us/articles/15402012-how-do-i-edit-my-map-visibility-on-strava · https://support.strava.com/en-us/articles/15401987-activity-privacy-controls · https://support.strava.com/en-us/articles/15401763-your-privacy-defaults-when-you-create-a-strava-account · https://support.strava.com/en-us/articles/15401723-what-are-my-privacy-control-defaults-on-strava-when-i-m-under-18 · https://support.strava.com/en-us/articles/15401776-strava-s-privacy-controls-faq · https://support.strava.com/en-us/articles/15401990-group-activities-privacy-controls · https://support.strava.com/en-us/articles/15401967-profile-page-privacy-controls · https://support.strava.com/en-us/articles/15402163-manage-followers-and-block-athletes | Visibility tiers, privacy zones, defaults, follow approval, blocking |
| SV-9 | Help | Social: feed ordering, kudos, comments, mentions, notifications, finding friends | https://support.strava.com/hc/en-us/articles/115001183630-Feed-Ordering · https://support.strava.com/en-us/articles/15402054-what-is-kudos · https://support.strava.com/hc/en-us/articles/216918407-Giving-and-Receiving-Comments · https://support.strava.com/en-us/articles/15401832-how-do-i-use-mentions-on-strava · https://support.strava.com/hc/en-us/articles/216918367-Strava-Notifications · https://support.strava.com/en-us/articles/15401934-finding-friends-and-managing-contacts-on-strava | Feed contents and ordering, kudos and comment mechanics, follow discovery |
| SV-10 | Help | Routes: community routes, creating routes on mobile, following a route, routes on web, route terrain | https://support.strava.com/en-us/articles/15401756-generated-community-routes · https://support.strava.com/hc/en-us/articles/18001474720397-Creating-Routes-on-Mobile · https://support.strava.com/en-us/articles/15401749-following-a-route · https://support.strava.com/en-us/articles/15401971-routes-on-web · https://support.strava.com/en-us/articles/15401687-route-terrain | Route builder gating, navigation, GPX and TCX export |
| SV-11 | Help | Clubs on the mobile app, Clubs on Strava, Club Posts, Group Events | https://support.strava.com/en-us/articles/15401837-clubs-on-the-mobile-app · https://support.strava.com/hc/en-us/articles/216918347-Clubs-on-Strava · https://support.strava.com/hc/en-us/articles/18288273144973-Club-Posts · https://support.strava.com/hc/en-us/articles/216918607-Group-Events-for-Clubs | Club page components, weekly leaderboard, events, posts |
| SV-12 | Help | Strava Challenges, Group Challenges, challenge participation privacy | https://support.strava.com/en-us/articles/15401916-strava-challenges · https://support.strava.com/en-us/articles/15401736-how-do-group-challenges-work-on-strava · https://support.strava.com/en-us/articles/15401551-challenge-participation-privacy-control | Join flow, eligibility, trophy case, group-challenge gating |
| SV-13 | Help | Training: Training Log, Goals, Fitness and Freshness, Relative Effort, Progress chart, Profile page, Streaks, Month in Sport, Year in Sport | https://support.strava.com/en-us/articles/15402077-training-log · https://support.strava.com/en-us/articles/15401694-goals-on-the-strava-app · https://support.strava.com/hc/en-us/articles/216918477-Fitness-Freshness · https://support.strava.com/en-us/articles/15401794-relative-effort · https://support.strava.com/en-us/articles/15401618-progress-summary-chart · https://support.strava.com/en-us/articles/15402175-your-strava-profile-page · https://support.strava.com/en-us/articles/15401580-streaks-on-strava · https://support.strava.com/en-us/articles/15401741-month-in-sport · https://support.strava.com/hc/en-us/articles/115001929810-Year-in-Sport | Training and goal screens and gating |
| SV-14 | Help | Athlete Intelligence on Strava, Strava MCP Connector | https://support.strava.com/en-us/articles/15401629-athlete-intelligence-on-strava · https://support.strava.com/en-us/articles/15401531-strava-mcp-connector | AI feature placement, sport types, opt-out, MCP rollout |
| SV-15 | Help | Activity pages: run activity pages, mute, hide details, quick edit, split tool | https://support.strava.com/en-us/articles/15401883-run-activity-pages · https://support.strava.com/en-us/articles/15401718-how-do-i-mute-an-activity-on-strava · https://support.strava.com/en-us/articles/15401769-hide-details-from-your-activities · https://support.strava.com/en-us/articles/15401614-activity-quick-edit · https://support.strava.com/en-us/articles/15401842-activity-split-tool | Activity detail and edit components |
| SV-16 | Help | Upload and sync: getting activities to Strava, bulk upload, troubleshooting syncing, no map, compatible devices, app authorization settings, pairing sensors, Health app | https://support.strava.com/en-us/articles/15402066-how-do-i-get-my-activities-to-strava · https://support.strava.com/en-us/articles/15402173-bulk-uploading-activities-to-strava · https://support.strava.com/en-us/articles/15402026-troubleshooting-syncing · https://support.strava.com/en-us/articles/15401579-why-is-there-no-map-on-my-activity · https://support.strava.com/en-us/articles/16312772-what-devices-and-apps-are-compatible-with-strava · https://support.strava.com/en-us/articles/15401779-app-authorization-settings · https://support.strava.com/en-us/articles/15401744-pairing-sensors-with-the-strava-app · https://support.strava.com/hc/en-us/articles/216917527-Health-App-and-Strava | File limits, offline and pending uploads, GPS-loss guidance, third-party permission screen |
| SV-17 | Help | Account and settings: Facebook login removed, one-time code, Sign in with Apple, iPhone app settings, dark mode | https://support.strava.com/en-us/articles/15401894-facebook-login-is-no-longer-supported · https://support.strava.com/en-us/articles/15401605-how-do-i-sign-in-to-strava-with-a-one-time-code · https://support.strava.com/en-us/articles/15401587-sign-in-with-apple · https://support.strava.com/en-us/articles/15402087-iphone-app-settings · https://support.strava.com/en-us/articles/15401628-dark-mode-on-strava | Sign-in options, settings menu |
| SV-18 | Help | Subscription: how to subscribe, Subscription Preview, Family Plan, Student Plan, Strava and Runna FAQs | https://support.strava.com/en-us/articles/15401704-how-to-subscribe · https://support.strava.com/en-us/articles/15401564-strava-subscription-preview · https://support.strava.com/en-us/articles/15401631-what-is-strava-s-family-plan · https://support.strava.com/en-us/articles/15401703-student-plan · https://support.strava.com/en-us/articles/15401576-strava-and-runna-subscription-faqs | Trial and preview mechanics, plan terms |
| SV-19 | API docs | Getting Started with the Strava API, developer home | https://developers.strava.com/docs/getting-started/ · https://developers.strava.com/ | App registration, single-player mode, self-upgrade tier limits (parts of the page are about 3 years old) |
| SV-20 | API docs | Authentication | https://developers.strava.com/docs/authentication/ | Scopes, token lifetime, refresh behavior |
| SV-21 | API docs | Rate Limits | https://developers.strava.com/docs/rate-limits/ | Current default limits, headers, 429, review threshold |
| SV-22 | API docs | Webhook Events API | https://developers.strava.com/docs/webhooks/ | Event types, payload, delivery rules |
| SV-23 | API docs | Uploading to Strava | https://developers.strava.com/docs/uploads/ | Formats, async status, duplicate error (page about 3.5 years old) |
| SV-24 | API docs | Strava API v3 reference | https://developers.strava.com/docs/reference/ | createActivity, model fields |
| SV-25 | API docs | V3 Changelog, Changes to the Segments API (2020) | https://developers.strava.com/docs/changelog/ · https://developers.strava.com/docs/segment-changes/ | 2026 endpoint removals, revoke endpoint, base-URL change, FIT set data, leaderboard removal |
| SV-26 | API docs | Strava brand guidelines | https://developers.strava.com/guidelines/ | Logo, naming and button rules (about 1 year old snapshot) |
| SV-27 | Legal | API Agreement (2026) | https://www.strava.com/legal/api | Compete-or-replicate ban, other-user data, termination deletion |
| SV-28 | Legal | API Policy (2026) | https://www.strava.com/legal/api_policy | Section 5.3 AI, 5.8 to 5.10 commercial, 6.2 to 6.4 retention, 7.4 deletion |
| SV-29 | Official blog | Press: Updates to Strava's API Agreement (Nov 2024), Community Hub explainer | https://press.strava.com/articles/updates-to-stravas-api-agreement · https://communityhub.strava.com/developers-api-7/api-agreement-update-how-data-appears-on-3rd-party-apps-7636 | The three November 2024 changes |
| SV-30 | Official blog | Community Hub: An Update To Our Developer Program (1 June 2026), API FAQ, Rate Limits KB, Developer Program KB | https://communityhub.strava.com/insider-journal-9/an-update-to-our-developer-program-13428 · https://communityhub.strava.com/developers-knowledge-base-14/strava-api-faq-12906 · https://communityhub.strava.com/developers-knowledge-base-14/rate-limits-3201 · https://communityhub.strava.com/developers-knowledge-base-14/our-developer-program-3203 | 2026 tiers, subscription requirement, intermediary ban, approved-limit examples |
| SV-31 | Community | Developer forum threads: 6.2 retention clarification, AI inference question, athlete-limit wait thread | https://communityhub.strava.com/developers-api-7/clarification-on-api-policy-6-2-retaining-an-athlete-s-own-activity-data-for-historical-comparison-13928 · https://communityhub.strava.com/developers-api-7/ai-inference-with-strava-data-is-it-prohibited-under-the-new-api-agreement-13256 · https://communityhub.strava.com/developers-api-7/everyone-waiting-on-athlete-limit-increase-let-s-coordinate-13265 | Informal staff and developer interpretations, not policy text |
| SV-32 | Official press | Samsung partnership (22 July 2026), Athlete Intelligence out of beta (Feb 2025), MCP connector (1 June 2026), strength overhaul (May 2026), Instant Workouts (Jan 2026), Runna bundle (July 2025), Family Plan launch | https://press.strava.com/articles/strava-samsung-partner-for-pre-installs-on-new-galaxy-watches-routes-integration-into-samsung-health · https://press.strava.com/articles/strava-enhances-subscriber-experience-with-updates-to-key-features · https://press.strava.com/articles/strava-launches-mcp-connector · https://press.strava.com/articles/strava-overhauls-strength-experience-with-expanded-partner-ecosystem-new-workout-log-and-muscle-maps · https://press.strava.com/articles/strava-launches-new-instant-workouts-feature-worldwide-to-provide · https://press.strava.com/articles/strava-runna-launch-combined-subscription-bundle · https://press.strava.com/articles/strava-launches-family-plan-a-shared-annual-subscription-for-athletes | Positioning boilerplate, user counts, 2025 to 2026 features |
| SV-33 | Official blog | Stories: What's New on Strava, May 2026 | https://stories.strava.com/articles/whats-new-on-strava-may-2026 | Off-route alerts, pace-zone and performance-prediction note |
| SV-34 | Store | App Store (US) listing and reviews | https://apps.apple.com/us/app/strava-run-bike-walk/id426826309 · https://apps.apple.com/us/app/strava-run-bike-walk/id426826309?see-all=reviews&platform=iphone | Rating, rating counts, IAP list, review excerpts |
| SV-35 | Store | Google Play (US) listing | https://play.google.com/store/apps/details?id=com.strava&hl=en_US | Rating, review count, installs, update date, review excerpts |
| SV-36 | Reviews | Trustpilot: Strava | https://www.trustpilot.com/review/strava.com | TrustScore, dated 2026 complaints |
| SV-37 | Reviews | Product Hunt: Strava reviews | https://www.producthunt.com/products/strava/reviews | Score, pros and cons excerpts |
| SV-38 | Reviews | r/Strava thread (archived snapshot, 26 March 2026) | https://reddit.sentinel-team.org/posts/1s2q23f/snapshots/2026-03-26T01%3A24%3A01.52878Z | Paywall-prompt complaint (archive mirror, reddit.com unreachable) |
| SV-39 | Review analysis | Unstar Play complaint analysis, OneStar, Kimola App Store sample | https://unstar.app/blog/strava-not-recording-activity-not-saved-gps-reviews-2026 · https://onestar.sh/r/orm3x-strava-what-do-subscribers-feel-they-paying · https://kimola.com/reports/unlock-insights-strava-app-user-feedback-report-app-store-us-151062 | Complaint-share statistics, quotes |
| SV-40 | Press (secondary) | DC Rainmaker (Nov 2024), road.cc (Dec 2025), TechRadar review, BikeRadar (2023 price rise), appsforstrava (2026), sahha (2026), independent-app-reviews | https://www.dcrainmaker.com/2024/11/stravas-changes-to-kill-off-apps.html · https://road.cc/content/news/strava-year-sport-now-only-subscribers-317425 · https://www.techradar.com/health-fitness/strava-is-still-the-best-training-app-for-runners-and-cyclists-but-its-getting-expensive · https://www.bikeradar.com/news/strava-hikes-monthly-subscription-cost-by-more-than-25-per-cent/ · https://appsforstrava.com/blog/strava-developer-program-changes-2026 · https://sahha.ai/blog/strava-api-changes-2026/ · https://independent-app-reviews.org/reviews/strava-review/ | Secondary context only |

### 8.2 Hevy sources

All accessed 2026-10-11. "Snippet" means the page was read through search-engine excerpts because the sandbox network policy denied the host. "Fetched" means the page was read directly.

| # | Type | Title | URL | Access | What it gave |
| --- | --- | --- | --- | --- | --- |
| HV-1 | Site | Hevy homepage | https://www.hevyapp.com/ | Snippet | Positioning, watch tracking claim |
| HV-2 | Site | About Us | https://www.hevyapp.com/about-us/ | Snippet | User count claim, founder location |
| HV-3 | Site | Feature pages under /features/ (gym-routines, gym-progress, exercise-library, track-workouts, supersets, plate calculator, share folders) | https://www.hevyapp.com/features/gym-routines/ and siblings | Snippet | Free routine cap, Pro chart ranges, animations, routine-update prompt, folder sharing |
| HV-4 | Blog | Community Update July 2026 | https://www.hevyapp.com/community-updates/july-26/ | Snippet | Trainer updates, Strava full sync, redesign |
| HV-5 | Blog, help | Announcing Hevy Trainer; Hevy Trainer Explained | https://www.hevyapp.com/announcing-hevy-trainer/ and https://help.hevyapp.com/hc/en-us/articles/38385724273047 | Snippet | Pro-only algorithmic programs |
| HV-6 | Help | Hevy Pro Subscription: what it includes | https://help.hevyapp.com/hc/en-us/articles/35119778922263 | Snippet | Free vs Pro table |
| HV-7 | Help | Import Strong CSV and Export Your Data | https://help.hevyapp.com/hc/en-us/articles/38001424401943 | Snippet | Import and export rules |
| HV-8 | Help | Body Composition: Measurements and Progress Photos | https://help.hevyapp.com/hc/en-us/articles/35385479603479 | Snippet | Measurement gating, photos |
| HV-9 | Help | Set Types Explained | https://help.hevyapp.com/hc/en-us/articles/34896293707927 | Snippet | Warm-up, drop, failure sets |
| HV-10 | Help | Build a Workout Program; Routine and Program Library | https://help.hevyapp.com/hc/en-us/articles/34953606698903 and .../36011518408983 | Snippet | Folders, Explore library |
| HV-11 | Help | Social Guide; Suggested Users | https://help.hevyapp.com/hc/en-us/articles/35688036014231 and .../34461853165079 | Snippet | Feed, Discover, privacy |
| HV-12 | Help | Exercise Performance Tracking; Exercise Library 400+; Custom Exercises | https://help.hevyapp.com/hc/en-us/articles/35382889578135, .../35688251991575, .../34264544382615 | Snippet | Charts, records, custom exercise fields |
| HV-13 | Help | Statistics Explained; Calendar and Streak | https://help.hevyapp.com/hc/en-us/articles/35702030346903 and .../35380117933207 | Snippet | Muscle stats, calendar |
| HV-14 | Help | How to Log a Workout | https://help.hevyapp.com/hc/en-us/articles/35361530647959 | Snippet | Start modes, PREVIOUS column, sharing |
| HV-15 | Help | Workout Settings and Preferences; Rest Timer; Units | https://help.hevyapp.com/hc/en-us/articles/33882110558743, .../35385404949143, .../34953292892823 | Snippet | Settings inventory |
| HV-16 | Help | Login Options; Uninstall and reinstall data | https://help.hevyapp.com/hc/en-us/articles/34462203494679 and .../38223672272791 | Snippet | Auth methods, in-progress workout storage |
| HV-17 | Help | Apple Health troubleshooting; Garmin not possible; Integrations category; Wear OS compatibility | https://help.hevyapp.com/hc/en-us/articles/36957445562775, .../35361029194647, https://help.hevyapp.com/hc/en-us/categories/33072994406423-Integrations, .../34895840771479 | Snippet | Integrations, watch support |
| HV-18 | API docs | Hevy Public API Docs | https://api.hevyapp.com/docs/ | Snippet (host blocked) | Version, Pro-only, key location, disclaimer |
| HV-19 | API docs capture | hevy-openapi.json in hevy-connect (states a byte-for-byte match with live docs on 2026-10-07) | https://github.com/koopycat/hevy-connect/blob/main/docs/hevy-openapi.json | Fetched | Endpoints, schemas, enums, pagination |
| HV-20 | API analysis | hevy-api-analysis.md | https://github.com/koopycat/hevy-connect/blob/main/docs/hevy-api-analysis.md | Fetched | Envelopes, page limits, no rate-limit contract |
| HV-21 | API mirror | openapi-spec.json in hevy-mcp | https://github.com/chrisdoc/hevy-mcp/blob/main/openapi-spec.json | Fetched | Server URL, same schema |
| HV-22 | SDK readmes | hevy-py; hevy-mcp | https://github.com/ewright3/hevy-py and https://github.com/chrisdoc/hevy-mcp | Fetched | Webhook subscription, no deletes, header |
| HV-23 | GitHub issue | heart-of-yours issue 265 | https://github.com/kit-g/heart-of-yours/issues/265 | Fetched | Webhook UI details (collected 2026-10-04) |
| HV-24 | Integration docs | Serval: Hevy; apis.io auth profile | https://docs.serval.com/sections/integrations/hevy and https://apis.io/security/hevy/hevy-authentication/ | Snippet | `api-key` header, Settings, Developer |
| HV-25 | Legal | Terms and Conditions (site and app) | https://www.hevyapp.com/legal/terms-and-conditions/ and https://www.hevyapp.com/app-terms-conditions/ | Snippet | Entity, license, content restrictions |
| HV-26 | Store | App Store listing | https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350 | Snippet | Title, seller, user count, withdrawal right |
| HV-27 | Store data | App Pricing Lab (Apple app, IAPs, Google Play) | https://apppricinglab.com/app/apple/1458862350, https://apppricinglab.com/iap/apple/1458862350, https://apppricinglab.com/app/google_play/com.hevy | Snippet | Ratings, counts, IAP prices (March and April 2026 snapshots) |
| HV-28 | Store mirrors | AppsHunter version history; APKMirror release notes | https://appshunter.io/ios/app/hevy/id1458862350 and https://www.apkmirror.com/apk/hevy-gym-workout-tracker/hevy-gym-log-workout-tracker/hevy-gym-log-workout-tracker-1-29-21-release/ | Snippet | Release notes, replace-exercise behavior, Wear OS notes |
| HV-29 | Press | Garage Gym Reviews; Hotel Gyms; Android Authority (old); ICON | https://garagegymreviews.com/equipment/hevy, https://www.hotelgyms.com/blog/hevy-workout-app-review-the-up-and-comer-taking-the-fitness-world-by-storm, https://cellphoneplans.androidauthority.com/CellPhones/Guides/hevy-app-review, https://iconpolls.com/blogs/hevy-review-2026-app-profile-login-coach-free-cost-pro-user-experience-frequently-asked-questions | Snippet | Pros, cons, scores |
| HV-30 | Community | GummySearch r/Hevy and reviews tool; MacPowerUsers thread; r/Hevy mirror | https://gummysearch.com/r/Hevy/, https://gummysearch.com/tools/best-products/workout-apps/, https://talk.macpowerusers.com/t/gym-iphone-app-recommendation/32667, https://redlib.groet-infra.nl/r/Hevy/new | Snippet | Quotes, topic counts |
| HV-31 | Hevy Coach | Capterra; GetApp; G2; Coachway; coach app listing | https://www.capterra.com/p/10015732/Hevy-Coach/, https://www.getapp.com/personal-trainer-software/a/hevy-coach, https://www.g2.com/products/hevy-coach/reviews, https://coachway.io/articles/hevy-coach-pricing/, https://apps.apple.com/us/app/hevy-coach-for-coaches-pt/id6502961756 | Snippet | Tiers, ratings |
| HV-32 | Competitor blogs (biased) | SensAI review; RepReturn | https://www.sensai.fit/blog/hevy-review-2026 and https://repreturn.com/hevy-app-review/ | Snippet | Free-tier confirmations |
| HV-33 | Ecosystem | Hevy Tracker Sheets add-on; hevy.com pricing and developer settings | https://workspace.google.com/marketplace/app/hevy_tracker/221696974247, https://hevy.com/pricing, https://hevy.com/settings?developer | Snippet | Pro needed for API, renewal rule |

### 8.3 The Standard (STNDRD) sources

All accessed 2026-10-11 through search-engine excerpts of the cited pages (direct fetches were blocked by the sandbox network policy).

| # | Type | Title | URL | What it gave |
| --- | --- | --- | --- | --- |
| TS-1 | Store | App Store (US): STNDRD Workout & Fitness Plans | https://apps.apple.com/us/app/stndrd-workout-fitness-plans/id1573298047 | Name, developer, rating, IAP tiers, description, release notes |
| TS-2 | Reviews | App Store ratings and reviews page | https://apps.apple.com/us/app/stndrd-workout-fitness-plans/id1573298047?see-all=reviews | User quotes, developer responses |
| TS-3 | Store | App Store developer page: Set The Standard LLC | https://apps.apple.com/us/developer/set-the-standard-llc/id1760419109 | Developer identity |
| TS-4 | Store | App Store cached listing under old slug | https://apps.apple.com/us/app/cbum-fitness/id1573298047 | Former names, older IAP prices |
| TS-5 | Store | Google Play: STNDRD Workout & Fitness Plans | https://play.google.com/store/apps/details?id=uni.cbum&hl=en_US | Rating, installs, support email, user reviews |
| TS-6 | Store | Google Play (en_AU snapshot) | https://play.google.com/store/apps/details?id=uni.cbum&hl=en_AU | Data safety section |
| TS-7 | Site | Official site | https://www.stndrd.app/ | Positioning, program catalog, pricing, food catalog claim, leaderboard and XP, community |
| TS-8 | Site | Checkout and plan comparison | https://checkout.stndrd.app/ | Base vs STNDRD+ tier contents |
| TS-9 | Legal | Terms and conditions | https://checkout.stndrd.app/stndrd/terms-and-conditions | No-refund policy, term lengths, generic-programs disclaimer |
| TS-10 | Site | Merch shop | https://shop.stndrd.app/collections/all | Group and 1:1 coaching listed as offerings |
| TS-11 | Site | Skool communities | https://www.skool.com/stndrd/about and https://www.skool.com/stndrd-coaching/about | Paid community, "STNDRD AI", weekly calls |
| TS-12 | Blog | Newsletter "The Standard with Chris Bumstead" | https://setthestandard.beehiiv.com/t/Dieting- | The newsletter owns "The Standard" name |
| TS-13 | Official social | @cbum relaunch and coach-introduction posts | https://www.tiktok.com/@cbum/video/7415303421181349162 and https://www.tiktok.com/@cbum/video/7418341766459346219 | Relaunch timing, coach identity |
| TS-14 | Video | Official YouTube channel | https://www.youtube.com/@SetTheSTNDRD | Brand framing |
| TS-15 | Teardown | ScreensDesign showcase | https://screensdesign.com/showcase/stndrd-bodybuilding-workouts | Tab structure, onboarding steps, paywall type, nutrition calculator |
| TS-16 | Teardown | Appllama screens page | https://appllama.io/apps/1573298047/stndrd-workout-fitness-plans | Welcome video, onboarding step count, prices |
| TS-17 | Analytics | mwm.ai app page | https://mwm.ai/apps/stndrd-bodybuilding-workouts/1573298047 | Download estimates, feature bullets |
| TS-18 | Press | Celebwell three-month review (2025-03-16) | https://celebwell.com/chris-bumstead-bodybuilding-app-review/ | Program list, coach videos, PR anecdotes |
| TS-19 | Press | Dr. Muscle and Sikly reviews | https://dr-muscle.com/chris-bumstead-app-review/ and https://www.sikly.com/cbum-fitness-app-review/ | Older Cbum-era features, affiliate style, low weight |
| TS-20 | Reviews | JustUseApp review aggregator | https://justuseapp.com/en/app/1573298047/stndrd-workout-fitness-plans/reviews | Rigidity complaints |
| TS-21 | Blog | Built By Foundry profile | https://www.builtbyfoundry.io/blog/chris-bumstead-cbum-raw-nutrition-fitness-empire | "Formerly CBUM Fitness", prices |
| TS-22 | Store mirror | AppBrain pages | https://www.appbrain.com/app/cbum-fitness/uni.cbum and https://www.appbrain.com/app/stndrd-coaching/io.everfit.wlstndrdcoaching | Play availability since Nov 2021, separate coaching app |
| TS-23 | Store mirror | APKPure and APKCombo | https://apkpure.com/cbum-fitness/uni.cbum and https://apkcombo.com/stndrd-bodybuilding-workouts/uni.cbum/ | Version dates only |
| TS-24 | Video | Third-party YouTube reviews (titles only) | https://www.youtube.com/watch?v=VHSh6Tnm30Y and others | Existence of 2026 reviews citing bugs and paywalls |
| TS-25 | Press | Justin King bio | https://agelessandtimeless.com/justin-king/ | King's role at STNDRD |
| TS-26 | Store | "STNDRD Collective" (unrelated app) | https://apps.apple.com/us/app/stndrd-collective/id6479536423 | Disambiguation only |
