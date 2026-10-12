# Codex runbook: verify the build on the Mac mini

For Codex (or any agent) on the owner's Mac mini while the owner is away. Your job is to verify and report. Claude implements; you test. Read `AGENTS.md` first.

## Rules

- Work only on branch `claude/two-directions`. Never push to `main`, open a pull request, force-push, or rewrite history.
- Do not change code, tests, the schema or docs. The only files you write are `docs/mac-run-report.md`, screenshots in `docs/mac-run/`, and the untracked `apps/direction-a/.env.local` and `apps/direction-b/.env.local`.
- Do not add or upgrade dependencies, run `npm audit fix`, or run EAS builds. If Expo Go reports an SDK mismatch, stop that step and report it.
- The Supabase Project URL and anon (or publishable) key are the only credentials you use. They are publishable. Never ask for or use a service-role or secret key, the database password, a Supabase access token, or Strava credentials.
- When a step fails, record the exact command, the full error and what you tried, then continue with the next independent step. Do not fix code.
- Stop every server you start before you finish, except a dev server the owner is still using.

## 0. Repo and branch

```bash
# The owner's existing clone (or: find ~ -maxdepth 5 -name AGENTS.md -path '*revivex*')
cd <clone of github.com/Monarchprimelabs/revivex-app>
git status --short            # must be empty; if not, stop and report what is modified
git fetch origin
git checkout claude/two-directions
git pull --ff-only origin claude/two-directions
node --version                # 20.19 or newer
```

No clone on the machine: `git clone https://github.com/Monarchprimelabs/revivex-app.git ~/Developer/revivex-app`, then the same commands.

## 1. Install and checks

```bash
npm ci
npm run typecheck
npm test
npm run test:db
(cd apps/direction-a && npx expo-doctor)
(cd apps/direction-b && npx expo-doctor)
npx playwright install chromium     # one-time browser download for the web tests
npm run e2e:full
npm run e2e:mock
(cd apps/direction-a && npx expo export --platform ios --output-dir /tmp/revivex-export-a)
(cd apps/direction-b && npx expo export --platform ios --output-dir /tmp/revivex-export-b)
```

What passed in the cloud sandbox on 2026-10-12 (counts may grow):

| Command | Expected |
| --- | --- |
| `npm run typecheck` | No errors |
| `npm test` | Every suite reports `0 failed` (12, 80, 67, 79, 19 checks) |
| `npm run test:db` | 73 passed |
| `npm run e2e:full` | 7 passed, 2 skipped |
| `npm run e2e:mock` | 2 passed (two-device sync against a local Supabase stand-in) |
| iOS exports | Both bundle |
| `expo-doctor` | Never run with network access before; paste its output verbatim, fix nothing |

## 2. iOS Simulator smoke test (only if Xcode is installed)

Check with `xcrun simctl list devices available | grep -i iphone`. If there is no simulator, skip this step and say so.

Start one app at a time from its folder with `npx expo start --ios --port <port> --clear` (Direction A on 8081, Direction B on 8082). Expo CLI installs the matching Expo Go into the simulator; if it waits on a prompt, answer it or report it. Once the app has loaded:

```bash
# Direction B (port 8082), from the repo root
xcrun simctl io booted screenshot docs/mac-run/b-today.png
xcrun simctl openurl booted "exp://127.0.0.1:8082/--/checkin"; sleep 3; xcrun simctl io booted screenshot docs/mac-run/b-checkin.png
xcrun simctl openurl booted "exp://127.0.0.1:8082/--/settings"; sleep 3; xcrun simctl io booted screenshot docs/mac-run/b-settings.png
# Direction A (port 8081): a fresh simulator shows onboarding
xcrun simctl io booted screenshot docs/mac-run/a-onboarding.png
sips -Z 1000 docs/mac-run/*.png
```

Look at each screenshot and note anything wrong: missing text, wrong font, clipped layout, light backgrounds, red error screens.

## 3. Real Supabase project (needs the owner)

Ask the owner for the Project URL and the anon key (newer dashboards call it the publishable key). Then, from the repo root:

```bash
printf 'REVIVEX_SUPABASE_URL=%s\nREVIVEX_SUPABASE_ANON_KEY=%s\n' '<url>' '<key>' > apps/direction-a/.env.local
cp apps/direction-a/.env.local apps/direction-b/.env.local
git status --short      # must still be empty: .env.local files are ignored
npm run e2e:live
```

Expected: 2 passed. Each run signs up two test accounts. If sign-up fails with an invalid-email message, ask the owner for an email address to use as a base and rerun with `REVIVEX_LIVE_EMAIL=<that address> npm run e2e:live`. If it fails mentioning confirmation, the owner needs to turn off "Confirm email" in Authentication. List the test account emails in the report so the owner can delete them.

## 4. Phone session (needs the owner, anywhere)

When the owner is ready, start Direction A with a tunnel and keep it running:

```bash
cd apps/direction-a && npx expo start --tunnel --clear --port 8081
```

Send the owner the `exp://…exp.direct` URL from the output. They open it in Expo Go on their phone (Expo Go → enter URL manually, or open the link in Safari). Suggest this order, and write down what they report:

1. Direction A: their existing history is still there. Profile → Account → create an account. Workout history cards show Syncing, then Synced. Log a short workout; it syncs. Profile → Your Data → Export, save the file to Files.
2. Stop Direction A, start Direction B the same way on port 8082 and send the new URL. Settings → Training history → Import the export. Set up the week, check in, look at the plan, Mark complete, edit what they actually did, save, open History.

If the tunnel fails, retry once, then report the error. Run one app at a time.

## 5. Report

Write `docs/mac-run-report.md`:

- Date, `sw_vers`, `node --version`, `xcodebuild -version` if Xcode exists.
- One table: step, command, result (pass, fail, skipped), notes.
- For each failure: the command, the full error in a code block, what you tried.
- `expo-doctor` output for both apps, verbatim.
- Screenshot list with one line on what each shows.
- Test accounts created by `e2e:live`.
- The owner's phone notes.

Then commit only the report and screenshots:

```bash
git add docs/mac-run-report.md docs/mac-run
git status --short      # nothing else staged; .env.local must not appear
git commit -m "Mac run report"
git pull --rebase --autostash origin claude/two-directions
git push origin claude/two-directions
```

Finish with a short message to the owner: what passed, what failed, and anything that needs their decision.
