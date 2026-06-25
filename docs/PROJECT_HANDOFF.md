# ReviveX Project Handoff

## Snapshot

- Project path: `/Users/georgegonzalez/Desktop/ReviveX-2026-06-20-Phase9-onboarding-profile-stable`
- App type: Expo-managed React Native app
- Framework: Expo SDK 54, React Native 0.81, React 19, Expo Router 6
- Language: TypeScript
- Package manager: npm
- Git status: not initialized as a Git repository yet

## Run Commands

```bash
npm install
npm run start
npm run ios
npm run android
npm run web
```

Preferred phone-testing command:

```bash
npx expo start --tunnel --clear
```

## Current Working Status

- Stable recovery baseline is the Phase 9 onboarding/profile snapshot dated 2026-06-20.
- The app is local-first and Expo Go compatible.
- No automated tests are configured yet.
- Branding, tone, and dark visual direction are part of the product contract and should be preserved.

## GitHub Preparation Notes

- Safe to initialize as a Git repo after ignoring generated folders, secrets, and archive files.
- Recommended repository name: `revivex-app`
- Recommended default branch: `main`
- Recommended first stable tag after initial import: `revivex-phase9-baseline-2026-06-25`

## Recommended CI Checks

- `npm ci`
- `npx expo-doctor`
- `npx tsc --noEmit`

## Immediate Risks

- There is no automated test coverage yet, so all changes require device smoke testing.
- Final app icon and splash assets are not in a release-ready state.
- Legacy technical identifiers still reference `hybridtrack`; do not rename them casually.
