# ReviveX

Lift. Run. Revive.

ReviveX is an Expo React Native hybrid fitness tracker for lifting, running, conditioning, and progress tracking. The product goal is to help everyday athletes rebuild the athlete inside them one session at a time.

## Stack

- App type: Expo-managed React Native app
- Framework: Expo SDK 54 + Expo Router
- Language: TypeScript
- Storage: AsyncStorage
- Package manager: npm

## Install Dependencies

```bash
npm install
```

## Run Locally

```bash
npm run start
npm run ios
npm run android
npm run web
```

For device testing in Expo Go:

```bash
npx expo start --tunnel --clear
```

## Test

There is no automated test suite configured yet.

Recommended local validation:

```bash
npx expo-doctor
npx tsc --noEmit
```

Then smoke test onboarding, profile, train logging, run logging, hybrid sessions, history screens, and dashboard totals in Expo Go.

## Current Known Status

- Stable checkpoint is the Phase 9 onboarding/profile baseline dated 2026-06-20.
- Visible branding must remain `ReviveX` with the tagline `Lift. Run. Revive.`.
- Mission to preserve: ReviveX helps everyday athletes track lifting, running, conditioning, and progress so they can rebuild the athlete inside them one session at a time.
- Styling to preserve: premium athletic, dark, clean, modern, with restrained neon accents. Do not push the whole app into a neon look.
- Technical identifiers still use legacy `hybridtrack` slug and bundle identifiers for compatibility.
- Final production icon and splash assets still need clean source files before release work.

## Docs

- `docs/PROJECT_HANDOFF.md`
- `docs/PHASE_HISTORY.md`
- `docs/AGENT_RULES.md`
- `docs/RELEASE_CHECKLIST.md`
- `PROJECT_STATE.md`
