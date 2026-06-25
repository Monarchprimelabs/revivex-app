# ReviveX Agent Rules

## Source Of Truth

This repository is the current master version of ReviveX, rebranded from HybridTrack.

- Continue from the current Expo SDK 54 codebase.
- Do not revert to SDK 51.
- Do not downgrade Expo, React, React Native, or Expo Router.
- Preserve Expo Go compatibility.
- Keep the existing 5-tab navigation: Home, Train, Run, Hybrid, Progress.
- Do not rename the project folder unless the user explicitly asks.

## Brand

- App name: ReviveX
- Tagline: Lift. Run. Revive.
- Product: hybrid fitness tracker for lifting, running, conditioning, routines, and progress.
- Visual style: premium dark-first interface with intentional teal/lime accents.
- Do not make the app overly neon.

## Product Constraints

Do not add these unless the user explicitly changes direction:

- Apple Health
- GPS running
- Supabase
- RevenueCat
- AI coach
- Subscriptions
- Backend login
- EAS build

## Engineering Rules

- Do not rebuild the app from scratch.
- Keep changes scoped to the requested phase.
- Prefer existing theme, components, context, and local storage patterns.
- Use AsyncStorage for local persistence unless the user asks for backend work.
- Do not run broad package upgrades unless required to fix a confirmed issue.
- Do not run `npm audit fix --force` casually.
- Do not delete user data or generated project files unless the task requires it.
- Preserve existing AsyncStorage keys unless implementing a safe migration.

## Current Stack

- Expo SDK 54
- Expo `54.0.35`
- React `19.1.0`
- React Native `0.81.5`
- Expo Router `6.0.24`
- TypeScript
- AsyncStorage

## Verification

After code changes, run:

```bash
npx tsc --noEmit
npx expo-doctor
```

For runtime verification, run one of:

```bash
npx expo start --tunnel --clear
npx expo export --platform ios --output-dir /tmp/revivex-export-check
```

Do not run EAS build unless the user explicitly requests it.

## Current Completed Phases

- Phase 1: App shell.
- Phase 2: Strength Workout Logger.
- Phase 3: Workout history/detail/repeat/delete was treated as complete before Phase 4.
- Phase 4: Routine Builder.
- Phase 5: Progress Dashboard v1.
- Phase 5.5: ReviveX rebrand and design system starter integration.
- Phase 5.6: UI polish and safe-area tab bar fix.
- Phase 6: Manual Run Logging v1.

## Asset Rules

- The ReviveX design system screenshot is a visual reference only.
- Do not crop the screenshot into production App Store assets.
- Only wire `app.json` icon/splash paths when clean PNG assets exist.
- See `assets/README.md` for required icon/logo files.

## Collaboration Workflow

- Claude can be used for planning, UX review, and second opinions.
- Codex should be used for code implementation, verification, and repo state.
- Keep `PROJECT_STATE.md` and `CLAUDE_HANDOFF.md` updated after major phases.
- Commit phase checkpoints with clear messages.
