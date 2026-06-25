# ReviveX Release Checklist

## Before Opening a PR

1. Confirm no secrets, build keys, archives, or generated folders are staged.
2. Run `npm install` or `npm ci`.
3. Run `npx expo-doctor`.
4. Run `npx tsc --noEmit`.
5. Smoke test onboarding, profile, workouts, runs, hybrid sessions, and history in Expo Go.

## Before Tagging a Stable Baseline

1. Confirm the app launches cleanly on the intended device.
2. Confirm the ReviveX name, tagline, and visual styling still match the approved direction.
3. Confirm no route, storage-key, or bundle-identifier renames slipped in accidentally.
4. Update `docs/PHASE_HISTORY.md` and `docs/PROJECT_HANDOFF.md`.
5. Create a dated tag for the stable checkpoint.

## Before Store Release Work

1. Confirm release-grade icon and splash assets exist.
2. Confirm version and build numbers are intentional.
3. Confirm any native capability or backend work was explicitly approved.
