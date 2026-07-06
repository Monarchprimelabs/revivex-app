# ReviveX Development Build (unlocks Apple Health + watch data)

Health sync is fully wired but dormant in Expo Go. A development build
activates it. One-time setup on the Mac Mini:

```bash
npm install -g eas-cli
eas login                 # Expo account (free)
eas build:configure       # links the project (creates the EAS project id)
```

Then build for your iPhone:

```bash
eas build --profile development --platform ios
```

- Sign in with the Apple Developer account when prompted; EAS manages
  certificates, the HealthKit entitlement, and device provisioning
  automatically (register your iPhone via the QR/link it prints).
- When the build finishes, install it from the link on your phone.
- Start the dev server the same as always: `npx expo start --tunnel`.
  The dev build replaces Expo Go — same workflow, plus native modules.

In the dev build, Profile → Connections → Health Sync will show
"Apple Health is ready" instead of the Expo Go notice. Tap Connect,
grant permissions, and every saved workout/run/hybrid session syncs to
Apple Health (and counts toward rings / appears alongside watch data).

Android later: `eas build --profile development --platform android`
covers Health Connect the same way.

Do not run EAS builds from CI/agents; run them from the Mac Mini where
you can authenticate with Apple.

## TestFlight

After the development build checks out (see docs/TESTING.md):

```bash
eas build --profile preview --platform ios
eas submit --platform ios
```

- Internal testers (your Apple team) get the build right away — no review.
- External testers require Apple beta review and a privacy policy URL.
- `preview` builds are release-mode: no dev menu, real performance.
