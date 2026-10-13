# Mac runbook: verify the build on the Mac mini

For the agent on the owner's Mac mini while the owner is away: since 2026-10-13, Claude Code in a Remote Control session the owner drives from the Claude app (Codex did runs 1 and 2). Your job is to verify and report. The cloud Claude session implements; you test. Read `AGENTS.md` first.

## Rules

- Work only on branch `claude/two-directions`. Never push to `main`, open a pull request, force-push, or rewrite history.
- Do not change code, tests, the schema or docs. The only files you write are `docs/mac-run-report.md`, screenshots in `docs/mac-run/`, and the untracked `apps/direction-a/.env.local` and `apps/direction-b/.env.local`.
- Do not add or upgrade dependencies, run `npm audit fix`, or run EAS builds. If Expo Go reports an SDK mismatch, stop that step and report it.
- The Supabase Project URL and anon (or publishable) key are the only credentials you use. They are publishable. Never ask for or use a service-role or secret key, the database password, a Supabase access token, or Strava credentials.
- When a step fails, record the exact command, the full error and what you tried, then continue with the next independent step. Do not fix code.
- Stop every server you start before you finish, except a dev server the owner is still using.

## Mac environment (lessons from runs 1 and 2, 2026-10-12 and 2026-10-13)

- **Use the clone at `~/Developer/revivex-app`.** On the first run, the Desktop clone's exports could not find files that existed on disk while watchman kept recrawling. From the fresh clone in `~/Developer`, with watchman reset, everything passed. The cause was not isolated, so keep using that clone.
- **Reset watchman** if it warns about recrawling: `watchman watch-del-all`.
- **Node:** 20.19 or newer. Node 26.4 works on this Mac. If something looks Node-related, retry the command with an LTS release from an app folder, for example `npx -y node@22 ../../node_modules/expo/bin/cli export --platform ios --output-dir /tmp/revivex-export`.
- **Playwright browser:** on this Mac `npx playwright install chromium` stalls after the download. Skip it and use Google Chrome: export `PLAYWRIGHT_CHROMIUM="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` before the e2e commands.
- **Expo Go in the simulator:** Expo CLI's automatic download fails on this Mac (`Fetching Expo Go`, then `fetch failed`, also with `NODE_OPTIONS=--dns-result-order=ipv4first`). Expo Go 54.0.7 was installed by hand on the iPhone 17 simulator on 2026-10-13. If Expo CLI tries to download it again, or you use another simulator, install it yourself: read `data.sdkVersions["54.0.0"].iosClientUrl` from `https://api.expo.dev/v2/versions/latest`, download that file with curl, check its layout with `tar -tzf`, extract it into a folder ending in `.app`, run `xcrun simctl install booted <that folder>`, then start Expo again.
- **Expo Go's first-run tutorial** covers the lower half of the screen the first time a project opens. Dismiss it before taking screenshots if you can control the simulator's UI. Claude Code in a terminal cannot tap the simulator: say so in the report and continue.
- **Keep the Mac awake** for the simulator steps: run `caffeinate -dims -t 7200 &` before step 2 (it stops by itself after two hours). If the Mac is already locked, simulator UI control fails; record that and ask the owner to unlock it instead of waiting.

## Starting Claude on the Mac

One-time setup in Terminal, or by a helper agent with terminal access. From the official Claude Code docs (code.claude.com/docs/en/setup and /remote-control), checked 2026-10-13.

```bash
claude --version                    # if missing: curl -fsSL https://claude.ai/install.sh | bash  (native installer, no sudo, installs ~/.local/bin/claude)
claude update                       # native installs also update themselves
claude doctor                       # install health and Remote Control eligibility
claude auth status --text           # exit 0 means signed in; Remote Control needs a claude.ai login (Pro, Max, Team or Enterprise), not an API key
```

If `claude` is not found after installing, add `~/.local/bin` to `PATH` in `~/.zshrc`. If it is not signed in, run `claude auth login`, open the URL it prints on any device, sign in with the owner's Claude account (the one on their phone), and paste the code the page shows back into the terminal.

Start the session inside tmux so it survives the terminal closing, and keep the Mac awake while it runs:

```bash
tmux new-session -d -s revivex -c ~/Developer/revivex-app
tmux send-keys -t revivex 'caffeinate -is claude remote-control --name "ReviveX Mac" --permission-mode default' Enter
tmux capture-pane -pt revivex       # first run asks "Enable Remote Control? (y/n)" and "Trust <folder>? [y/N]"; answer with: tmux send-keys -t revivex y Enter
```

The pane then shows a session URL. The owner opens it, or opens the Claude app → Code → "ReviveX Mac" (green dot means online), and approves permission prompts from the phone. Never start it with `bypassPermissions` or `dontAsk`. If the process stops, run `claude remote-control --continue` in the same folder within about four hours to bring the last session back.

## 0. Repo and branch

```bash
git clone https://github.com/Monarchprimelabs/revivex-app.git ~/Developer/revivex-app   # skip if it exists
cd ~/Developer/revivex-app
git status --short            # must be empty; if not, stop and report what is modified
git fetch origin
git switch claude/two-directions
git pull --ff-only origin claude/two-directions
watchman watch-del-all
node --version                # 20.19 or newer
```

Do not work in `/Users/geo/Desktop/revivex-app`. That clone holds the owner's preserved local branch `mac-local-changes-2026-10-12` and the first run's report; leave both untouched.

## 1. Install and checks

```bash
npm ci
npm run typecheck
npm test
npm run test:db
(cd apps/direction-a && npx expo-doctor)
(cd apps/direction-b && npx expo-doctor)
npx playwright install chromium     # one-time browser download; skip on the owner's Mac mini (see Mac environment)
npm run e2e:full
npm run e2e:mock
(cd apps/direction-a && npx expo export --platform ios --output-dir /tmp/revivex-export-a)
(cd apps/direction-b && npx expo export --platform ios --output-dir /tmp/revivex-export-b)
```

What passed in the cloud sandbox on 2026-10-12 (counts may grow):

| Command | Expected |
| --- | --- |
| `npm run typecheck` | No errors |
| `npm test` | Every suite reports `0 failed` (20, 80, 67, 79, 19 checks) |
| `npm run test:db` | 73 passed |
| `npm run e2e:full` | 7 passed, 2 skipped |
| `npm run e2e:mock` | 2 passed (two-device sync against a local Supabase stand-in) |
| iOS exports | Both bundle |
| `expo-doctor` | 18/18 (confirmed on the Mac on 2026-10-12); paste its output verbatim, fix nothing |

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

Look at each screenshot and note anything wrong: missing text, wrong font, clipped layout, light backgrounds, red error screens. Direction A should no longer show a red error on launch (fixed 2026-10-13, test report bug 10). If any red screen appears, save it as `docs/mac-run/a-error.png` or `b-error.png` and paste the full message in the report.

## 3. Real Supabase project (needs the owner)

The cloud Claude session can also run this step, because it can reach Supabase. Run it here only when the owner gives you the Project URL and the anon key (newer dashboards call it the publishable key). Then, from the repo root:

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

If `docs/mac-run-report.md` already exists from an earlier run (it may only exist in the Desktop clone, uncommitted), copy it and `docs/mac-run/` into this clone first and append a new dated section instead of rewriting the old one.

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
