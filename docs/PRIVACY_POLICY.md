# ReviveX Privacy Policy

**Effective date: July 6, 2026**

**Last updated: September 2, 2026**

ReviveX ("the app") is a fitness tracker published by Revival Fitness /
Monarch Prime Labs. This policy explains what data the app handles and how.
The short version: **your data stays on your device.** ReviveX has no
accounts, no cloud storage, no analytics, no ads, and no tracking.

## Data the app stores

ReviveX stores the following **only on your device**, in the app's local
storage:

- Your profile (display name, optional username, training preferences, units)
- Strength workouts, routines, runs, hybrid sessions, and body weight entries
- GPS routes and splits for runs you choose to track with GPS
- Health sync settings and bookkeeping (which items have been synced)

We (the developers) cannot see, access, or recover any of this data. It never
leaves your device unless you explicitly share or export it. The one thing the
app does request from outside is map imagery, on iOS only, to draw a run's
route on a map — see "Maps" below; the run itself is not sent.

## Location (GPS runs)

If you start a GPS run, the app uses your device's location to measure
distance, pace, splits, and route — while the run is active. With background
permission granted, tracking continues while the screen is locked **during an
active run only**. Location data is stored locally as part of the saved run
and is never uploaded to us or to any third party. (On iOS, displaying the
saved route on a map does request map imagery for the area around it from
Apple's map service — the route itself is not sent; see "Maps" below.) You
can use the entire app without granting location access; GPS tracking is
optional.

## Maps

On iOS, ReviveX draws the route of a saved GPS run on an Apple Maps view. To
render that view, the device requests map imagery (map tiles) for the area
around the route from Apple's map servers — the same request any app that
shows a map makes. ReviveX attaches no account, name, or identifier of yours
to that request, and the run itself (route points, splits, times) is never
uploaded; only the map area to draw is requested. Apple's privacy policy
governs the map service: https://www.apple.com/legal/privacy/. On Android,
and in builds without the native map module (such as Expo Go), the app draws
a simple local trace of the route instead and requests nothing from any map
service.

## Apple Health and Health Connect

If you choose to connect Apple Health (iOS) or Health Connect (Android):

- ReviveX **writes** your workouts, runs, hybrid sessions, and body weight to
  the health store on your device.
- ReviveX **reads** workouts (e.g., recorded by your watch), heart rate,
  active energy, your daily step count, and (on Android) the distance
  recorded for an imported run, to display them in the app (watch metrics,
  daily activity rings) and import workouts into your local training log.

Health data is used solely to provide these in-app features. It is never used
for advertising, marketing, or data mining, never sold, and never disclosed
to third parties. Health access is optional and can be revoked at any time in
the Apple Health or Health Connect settings; the app keeps working without it.

## Sharing and export

Share cards (images/text) and data exports (JSON) are created only when you
tap share/export, and go only to the apps **you** choose in your device's
share sheet. Nothing is shared automatically.

## What we don't do

- No user accounts or sign-in
- No servers of ours receiving your personal data — ReviveX has no backend, and
  nothing you log is sent to us
- No third-party analytics, advertising, or tracking SDKs
- No sale or sharing of personal data (including under CCPA definitions)

## Data retention and deletion

All data lives on your device. Deleting items in the app removes them from
local storage; uninstalling the app deletes all app data (data you wrote to
Apple Health / Health Connect remains there under those platforms' controls,
where you can delete it).

## Children

ReviveX is not directed at children under 13 and does not knowingly collect
personal information from them.

## Changes

If a future version adds online features (e.g., optional accounts or social
features), this policy will be updated first and the app will ask for your
consent before any data leaves your device.

## Contact

Questions about this policy: email monarchprimelabs@gmail.com.

The current version of this policy is published at
https://monarchprimelabs.github.io/apps/revivex/privacy.html.
