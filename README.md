# ReviveX

Lift. Run. Revive.

ReviveX is a hybrid fitness tracker for lifting, running, conditioning, routines, and progress analytics. This repository is a monorepo exploring two product directions on one backend and one design system:

- `apps/direction-a/`: the existing hybrid tracker (Phase 50).
- `apps/direction-b/`: a single-screen daily coach driven by a deterministic rules engine.
- `packages/`: shared code (`@revivex/core`, `@revivex/design-system`, `@revivex/backend`, `@revivex/test-utils`).
- `db/`: the shared Supabase schema with row-level security, plus policy tests.
- `docs/`: recon, architecture proposal, feature backlogs, operational docs.

## Run

```bash
npm install
npm run start:a      # Direction A, scan the QR code with Expo Go
npm run start:b      # Direction B
```

From inside an app folder you can also run `npx expo start --tunnel --clear`.

## Verify

```bash
npm run typecheck    # every workspace
npm test             # unit suites (core and Direction A)
npm run test:db      # schema and row-level security policies in PGlite
```

## Tech

- Expo SDK 54, React Native 0.81, React 19, Expo Router 6, TypeScript
- npm workspaces, AsyncStorage (local-first), Supabase (auth, Postgres with RLS, Edge Functions)
- Expo Go compatible. Native modules in Direction A load lazily and activate in a development build.

## Status

- Step 1 recon: `docs/recon.md`
- Step 2 restructure and architecture proposal: `docs/architecture.md`, `db/schema.sql`
- Direction A phase history: `PROJECT_STATE.md`

## Brand Direction

- App name: ReviveX
- Tagline: Lift. Run. Revive.
- Interface: premium dark-first UI with restrained teal/lime accents, original assets only.
